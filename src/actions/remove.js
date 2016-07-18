import _ from 'lodash';
import { RSAA } from 'redux-api-middleware';
import {
  REMOVE_REQUEST,
  REMOVE_SUCCESS,
  REMOVE_ERROR,
} from './../middleware';
import { JSON_API_SOURCE } from './..';

// Action creator used to delete item on api (DELETE). Config arg is based on RSAA
// configuration from redux-api-middleware, allowing full customization expect types
// part of configuration. Delete function expects schema name of data which correspond
// with storage reducer with same schema value to listen for deleted data. Item arg
// holds object that you want to pass to api. Tag is not needed because all collection
// with configured schema value as in argument of delete will be invalidated upon successful
// action of deleting item on api.
export default (config, schema, item) => {
  if (!_.isObject(config)) {
    throw new TypeError('Config isn\'t object.');
  }
  if (!_.isString(schema) || _.isEmpty(schema)) {
    throw new Error('Schema is invalid.');
  }
  if (!_.isObject(item)) {
    throw new Error('Item isn\'t object.');
  }

  const meta = {
    source: JSON_API_SOURCE,
    schema,
  };

  return {
    [RSAA]: {
      method: 'DELETE',
      ...config,
      types: [
        {
          type: REMOVE_REQUEST,
          meta,
          payload: { data: item },
        },
        {
          type: REMOVE_SUCCESS,
          meta,
          payload: () => ({ data: item }),
        },
        {
          type: REMOVE_ERROR,
          meta,
        },
      ],
    },
  };
};
