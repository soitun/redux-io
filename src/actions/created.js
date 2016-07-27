import _ from 'lodash';
import {
  CREATE_SUCCESS,
} from './../middleware';
import { JSON_API_SOURCE } from './..';

export default (payload, schema) => {
  if (!_.isPlainObject(payload)) {
    throw new Error('Invalid payload type.');
  }
  if (!_.isArray(payload.data) && !_.isPlainObject(payload.data)) {
    throw new Error('Missing payload data property.');
  }
  if (!_.isString(schema)) {
    throw new Error('Schema is invalid.');
  }

  return {
    type: CREATE_SUCCESS,
    payload,
    meta: {
      source: JSON_API_SOURCE,
      schema,
    },
  };
};