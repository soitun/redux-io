/* eslint-disable no-unused-expressions */
import _ from 'lodash';

import {
  validationStatus,
  busyStatus,
} from './status';

export const CREATE_REQUEST = '@@redux_api_state/CREATE_REQUEST';
export const CREATE_SUCCESS = '@@redux_api_state/CREATE_SUCCESS';
export const CREATE_ERROR = '@@redux_api_state/CREATE_ERROR';

export const LOAD_REQUEST = '@@redux_api_state/LOAD_REQUEST';
export const LOAD_SUCCESS = '@@redux_api_state/LOAD_SUCCESS';
export const LOAD_ERROR = '@@redux_api_state/LOAD_ERROR';

export const UPDATE_REQUEST = '@@redux_api_state/UPDATE_REQUEST';
export const UPDATE_SUCCESS = '@@redux_api_state/UPDATE_SUCCESS';
export const UPDATE_ERROR = '@@redux_api_state/UPDATE_ERROR';

export const REMOVE_REQUEST = '@@redux_api_state/REMOVE_REQUEST';
export const REMOVE_SUCCESS = '@@redux_api_state/REMOVE_SUCCESS';
export const REMOVE_ERROR = '@@redux_api_state/REMOVE_ERROR';

export const COLLECTION_FETCHED = '@@redux_api_state/COLLECTION_FETCHED';
export const COLLECTION_STATUS = '@@redux_api_state/COLLECTION_STATUS';

export const OBJECTS_FETCHED = '@@redux_api_state/OBJECTS_FETCHED';
export const OBJECTS_UPDATING = '@@redux_api_state/OBJECTS_UPDATING';
export const OBJECTS_UPDATED = '@@redux_api_state/OBJECTS_UPDATED';
export const OBJECTS_CREATED = '@@redux_api_state/OBJECTS_CREATED';
export const OBJECTS_REMOVING = '@@redux_api_state/OBJECTS_REMOVING';
export const OBJECTS_REMOVED = '@@redux_api_state/OBJECTS_REMOVED';

export const middlewareJsonApiSource = '@@redux_api_state/json_api';

const actionsWithoutPayload = new Set([
  REMOVE_SUCCESS,
  LOAD_REQUEST,
  CREATE_REQUEST,
]);

function makeCollectionAction(sourceAction, actionType, data, schema, tag = '*') {
  if (!actionType) {
    throw new Error('Action type is not valid.');
  }
  if (!data) {
    throw new Error('Data is not valid.');
  }
  if (!schema) {
    throw new Error('Schema is not valid.');
  }
  if (tag === undefined || tag === null) {
    throw new Error('Tag is not valid.');
  }

  return {
    type: actionType,
    payload: data,
    meta: {
      ...sourceAction.meta,
      schema,
      tag,
    },
  };
}

function makeObjectsAction(sourceAction, actionType, items, schema) {
  if (!actionType) {
    throw new Error('Action type is not valid.');
  }
  if (!items) {
    throw new Error('Data is not valid.');
  }
  if (!schema) {
    throw new Error('Schema is not valid.');
  }

  return {
    type: actionType,
    payload: items,
    meta: {
      ...sourceAction.meta,
      schema,
    },
  };
}

const actionHandlers = {
  [LOAD_REQUEST]: (action, data, dispatch) => {
    // Make collection busy to prevent multiple requests
    const { schema, tag } = action.meta;
    // Validate action meta has a tag value
    if (!_.isString(tag)) {
      return;
    }
    dispatch(makeCollectionAction(
      action,
      COLLECTION_STATUS,
      { busyStatus: busyStatus.BUSY },
      schema,
      tag
    ));
  },
  [LOAD_SUCCESS]: (action, data, dispatch) => {
    // Dispatch objects to storages and collection with specific tag
    const { schema, tag } = action.meta;
    // Validate action meta has a tag value
    if (!_.isString(tag)) {
      return;
    }
    dispatch(makeObjectsAction(action, OBJECTS_FETCHED, data, schema));
    // TODO: once when we support findOne action and single reducer, COLLECTION_FETCHED
    // should trigger only for collections
    dispatch(makeCollectionAction(action, COLLECTION_FETCHED, data, schema, tag));
  },
  [CREATE_REQUEST]: (action, data, dispatch) => {
    // Change collection status to busy and invalid to prevent fetching.
    const schema = action.meta.schema;
    dispatch(makeCollectionAction(
      action,
      COLLECTION_STATUS,
      { validationStatus: validationStatus.INVALID, busyStatus: busyStatus.BUSY },
      schema
    ));
  },
  [CREATE_SUCCESS]: (action, data, dispatch) => {
    // Dispatch created objects to storage and change collection status to invalid, idle
    const schema = action.meta.schema;
    dispatch(makeObjectsAction(action, OBJECTS_CREATED, data, schema))
    dispatch(makeCollectionAction(
      action,
      COLLECTION_STATUS,
      { validationStatus: validationStatus.INVALID, busyStatus: busyStatus.IDLE },
      schema
    ));
  },
  [UPDATE_REQUEST]: (action, data, dispatch) => {
    // Change collection status to busy and invalid to prevent fetching and because of
    // local changes in storage state with updated item.
    const schema = action.meta.schema;
    dispatch(makeCollectionAction(
      action,
      COLLECTION_STATUS,
      { validationStatus: validationStatus.INVALID, busyStatus: busyStatus.BUSY },
      schema
    ));
    dispatch(makeObjectsAction(action, OBJECTS_UPDATING, data, schema));
  },
  [UPDATE_SUCCESS]: (action, data, dispatch) => {
    // Dispatch updated objects from and change collections status to idle & invalid
    const schema = action.meta.schema;
    dispatch(makeObjectsAction(action, OBJECTS_UPDATED, data, schema));
    dispatch(makeCollectionAction(
      action,
      COLLECTION_STATUS,
      { validationStatus: validationStatus.INVALID, busyStatus: busyStatus.IDLE },
      schema
    ));
  },
  [REMOVE_REQUEST]: (action, data, dispatch) => {
    // Change collections status to busy and invalid because of removing item in
    // local storage state
    const schema = action.meta.schema;
    dispatch(makeCollectionAction(
      action,
      COLLECTION_STATUS,
      { validationStatus: validationStatus.INVALID, busyStatus: busyStatus.BUSY },
      schema
    ));
    dispatch(makeObjectsAction(action, OBJECTS_REMOVING, data, schema));
  },
  [REMOVE_SUCCESS]: (action, data, dispatch) => {
    // Remove object if already not removed during request
    const schema = action.meta.schema;
    dispatch(makeObjectsAction(action, OBJECTS_REMOVED, data, schema));
    dispatch(makeCollectionAction(
      action,
      COLLECTION_STATUS,
      { validationStatus: validationStatus.INVALID, busyStatus: busyStatus.IDLE },
      schema
    ));
  },
};

function isValidAction(action) {
  if (!actionHandlers[action.type]) {
    return false;
  }
  // Check for meta object in action
  if (action.meta === undefined) {
    throw new Error('Meta is undefined.');
  }
  const meta = action.meta;
  // Check if source exists
  if (meta.source === undefined) {
    throw new Error('Source is undefined.');
  }
  // Source exists but this middleware is not responsible for other source variants
  // only for json_api
  if (meta.source !== middlewareJsonApiSource) {
    return false;
  }
  // Check that schema is defined
  if (!meta.schema) {
    throw new Error('Schema is invalid.');
  }
  // Validate payload for payload-specific action, ignore others
  if (!actionsWithoutPayload.has(action.type)
    && !_.has(action, 'payload.data')) {
    throw new Error('Payload Data is invalid, expecting payload.data.');
  }

  return true;
}

const getData = payload => {
  const data = payload && payload.data || [];
  return [].concat(data);
};
const getIncluded = payload => (
  _.has(payload, 'included') ? payload.included : []
);

export default store => next => action => {
  // Validate action, if not valid pass
  if (!isValidAction(action)) {
    return next(action);
  }

  const dispatch = store.dispatch;

  // First dispatch included objects
  const included = getIncluded(action.payload);
  const includeSchemasMap = _.groupBy(included, 'type');
  _.forEach(includeSchemasMap, (items, schema) =>
    dispatch(makeObjectsAction(action, OBJECTS_FETCHED, items, schema))
  );

  // Find handler for supported action type to make appropriate logic
  const data = getData(action.payload);
  actionHandlers[action.type](action, data, dispatch);

  // After middleware handled action pass input action to next
  return next(action);
};
