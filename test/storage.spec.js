/* eslint-disable no-unused-expressions */
import _ from 'lodash';
import chai, { expect } from 'chai';
import shallowDeepEqual from 'chai-shallow-deep-equal';
import deepFreeze from 'deep-freeze';
import {
  storage,
  OBJECT_CREATED,
  OBJECT_FETCHED,
  OBJECT_REMOVING,
  OBJECT_REMOVED,
  OBJECT_UPDATING,
  OBJECT_UPDATED,
} from '../src';
import {
  STATUS,
  validationStatus,
  busyStatus,
  createStatus,
  updateStatus,
} from '../src/status';

chai.use(shallowDeepEqual);

describe('Storage reducer', () => {
  it('has a valid initial state', () => {
    const testReducer = storage('test');
    const state = testReducer(undefined, {});

    expect(state[STATUS].schema).to.eql('test');
    expect(state).to.shallowDeepEqual({});
  });

  it('adds item to state on object fetched', () => {
    const initialState = {};
    const item = { id: 1 };
    const schema = 'schema_test';
    const action = {
      type: OBJECT_FETCHED,
      meta: {
        schema,
      },
      payload: item,
    };
    const reducer = storage(schema, initialState);
    deepFreeze(initialState);

    const nextState = reducer(initialState, action);
    const expectedState = { [item.id]: item };
    const nextStateItem = nextState[item.id];

    expect(nextState).to.shallowDeepEqual(expectedState);
    expect(nextStateItem).to.deep.equal(item);
    expect(nextStateItem[STATUS].validationStatus).to.eql(validationStatus.VALID);
    expect(nextStateItem[STATUS].busyStatus).to.eql(busyStatus.IDLE);
  });

  it('adds item to state on object created', () => {
    const initialState = {};
    const item = { id: 1 };
    const schema = 'schema_test';
    const action = {
      type: OBJECT_CREATED,
      meta: {
        schema,
      },
      payload: item,
    };
    const reducer = storage(schema, initialState);
    deepFreeze(initialState);

    const nextState = reducer(initialState, action);
    const expectedState = { [item.id]: item };
    const nextStateItem = nextState[item.id];

    expect(nextState).to.shallowDeepEqual(expectedState);
    expect(nextStateItem).to.deep.equal(item);
    expect(nextStateItem[STATUS].validationStatus).to.eql(validationStatus.VALID);
    expect(nextStateItem[STATUS].busyStatus).to.eql(busyStatus.IDLE);
  });

  it('removes item from state on object removed', () => {
    const initialState = {
      1: { id: 1 },
      2: { id: 2 },
    };
    const schema = 'schema_test';
    const action = {
      type: OBJECT_REMOVED,
      payload: { id: 1 },
      meta: {
        schema,
      },
    };
    const reducer = storage(schema, initialState);
    deepFreeze(initialState);
    const nextState = reducer(initialState, action);
    const expectedState = {
      2: { id: 2 },
    };

    expect(nextState).to.shallowDeepEqual(expectedState);
  });

  it('removing non existing item from state does not produce error', () => {
    const initialState = {
      1: { id: 1 },
    };
    const schema = 'schema_test';
    const action = {
      type: OBJECT_REMOVED,
      payload: { id: 5 },
      meta: {
        schema,
      },
    };
    const reducer = storage(schema, initialState);
    deepFreeze(initialState);
    const nextState = reducer(initialState, action);
    const expectedState = {
      1: { id: 1 },
    };

    expect(nextState).to.shallowDeepEqual(expectedState);
  });

  it('ignores action with different schema type', () => {
    const initialState = {};
    const item = { id: 1 };
    const schema = 'schema_test';
    const action = {
      type: OBJECT_FETCHED,
      meta: {
        schema: 'test2',
      },
      payload: item,
    };
    const reducer = storage(schema, initialState);
    deepFreeze(initialState);
    const nextState = reducer(initialState, action);

    expect(nextState).to.equal(initialState);
    expect(nextState).to.deep.equal(initialState);
  });

  it('ignores action with different action type', () => {
    const initialState = {};
    const item = { id: 1 };
    const schema = 'schema_test';
    const action = {
      type: 'OBJECT_FETCHED',
      meta: {
        schema,
      },
      payload: item,
    };
    const reducer = storage(schema, initialState);
    deepFreeze(initialState);
    const nextState = reducer(initialState, action);

    expect(nextState).to.equal(initialState);
    expect(nextState).to.deep.equal(initialState);
  });

  it('replaces object with same id in storage', () => {
    const item = { id: 1, value: 'a' };
    const initialState = { [item.id]: item };
    const schema = 'schema_test';
    const reducer = storage(schema, initialState);
    deepFreeze(initialState);

    const itemNew = { id: 1, value: 'b' };
    const action = {
      type: OBJECT_FETCHED,
      meta: {
        schema,
      },
      payload: itemNew,
    };

    const nextState = reducer(initialState, action);
    const nextStateItem = nextState[item.id];

    const expectedState = { [itemNew.id]: itemNew };
    expect(nextState).to.shallowDeepEqual(expectedState);
    expect(nextStateItem).to.deep.equal(itemNew);
    expect(nextStateItem[STATUS].validationStatus).to.eql(validationStatus.VALID);
    expect(nextStateItem[STATUS].busyStatus).to.eql(busyStatus.IDLE);
  });

  it('keeps object with different id in storage', () => {
    const item1 = { id: 1, value: 'a' };
    const initialState = { [item1.id]: item1 };
    const schema = 'schema_test';
    const reducer = storage(schema, initialState);
    deepFreeze(initialState);

    const item2 = { id: 2, value: 'b' };
    const action = {
      type: OBJECT_FETCHED,
      meta: {
        schema,
      },
      payload: item2,
    };

    const nextState = reducer(initialState, action);
    const expectedState = { [item1.id]: item1, [item2.id]: item2 };
    expect(nextState).to.shallowDeepEqual(expectedState);
  });

  it('partial update item and it\'s status in state on object updating', () => {
    const item = {
      id: 2,
      type: 'a',
      attributes: {
        aa: 1,
        bb: [1, 2, 3],
      },
      relationships: {
        cc: {
          data: { id: 1, type: 'c' },
        },
        dd: {
          data: [
            { id: 1, type: 'c' },
            { id: 2, type: 'd' },
            { id: 3, type: 'e' },
          ],
        },
      },
    };
    item[STATUS] = createStatus();
    const initialState = { [item.id]: item };
    const schema = 'schema_test';
    const reducer = storage(schema, initialState);
    deepFreeze(initialState);

    const itemPatch = {
      id: 2,
      type: 'a',
      attributes: {
        bb: [2],
      },
      relationships: {
        dd: {
          data: [
            { id: 2, type: 'd' },
          ],
        },
      },
    };

    const action = {
      type: OBJECT_UPDATING,
      meta: {
        schema,
      },
      payload: itemPatch,
    };

    const nextState = reducer(initialState, action);
    const nextStateItem = nextState[item.id];

    const itemNew = {
      id: 2,
      type: 'a',
      attributes: {
        aa: 1,
        bb: [2],
      },
      relationships: {
        cc: {
          data: { id: 1, type: 'c' },
        },
        dd: {
          data: [
            { id: 2, type: 'd' },
          ],
        },
      },
    };

    const expectedState = { [itemNew.id]: itemNew };
    expect(nextStateItem[STATUS].validationStatus).to.eql(validationStatus.INVALID);
    expect(nextStateItem[STATUS].busyStatus).to.eql(busyStatus.BUSY);
    delete nextStateItem[STATUS];
    expect(nextState).to.shallowDeepEqual(expectedState);
    expect(nextStateItem).to.deep.equal(itemNew);
  });

  it('skips partial update of item on object updating if object not found', () => {
    const item = {
      id: 3,
      type: 'a',
      attributes: {
        aa: 1,
        bb: [1, 2, 3],
      },
      relationships: {
        cc: {
          data: { id: 1, type: 'c' },
        },
        dd: {
          data: [
            { id: 1, type: 'c' },
            { id: 2, type: 'd' },
            { id: 3, type: 'e' },
          ],
        },
      },
    };
    item[STATUS] = createStatus();
    const initialState = { [item.id]: item };
    const schema = 'schema_test';
    const reducer = storage(schema, initialState);
    deepFreeze(initialState);

    const itemPatch = {
      id: 2,
      type: 'a',
      attributes: {
        bb: [2],
      },
      relationships: {
        dd: {
          data: [
            { id: 2, type: 'd' },
          ],
        },
      },
    };

    const action = {
      type: OBJECT_UPDATING,
      meta: {
        schema,
      },
      payload: itemPatch,
    };

    const nextState = reducer(initialState, action);
    const nextStateItem = nextState[itemPatch.id];

    expect(nextStateItem).to.be.undefined;
    expect(nextState).to.shallowDeepEqual(initialState);
  });

  it('updates item and it\'s status in state on object updating', () => {
    const item = {
      id: 2,
      type: 'a',
      attributes: {
        aa: 1,
        bb: [1, 2, 3],
      },
      relationships: {
        cc: {
          data: { id: 1, type: 'c' },
        },
        dd: {
          data: [
            { id: 1, type: 'c' },
            { id: 2, type: 'd' },
            { id: 3, type: 'e' },
          ],
        },
      },
    };
    item[STATUS] = createStatus();
    const initialState = { [item.id]: item };
    const schema = 'schema_test';
    const reducer = storage(schema, initialState);
    deepFreeze(initialState);

    const itemNew = {
      id: 2,
      type: 'a',
      attributes: {
        aa: 2,
        bb: [3],
      },
      relationships: {
        cc: {
          data: { id: 5, type: 'c' },
        },
        dd: {
          data: [
            { id: 4, type: 'f' },
            { id: 5, type: 'g' },
            { id: 6, type: 'h' },
          ],
        },
      },
    };

    const action = {
      type: OBJECT_UPDATING,
      meta: {
        schema,
      },
      payload: itemNew,
    };

    const nextState = reducer(initialState, action);
    const nextStateItem = nextState[item.id];

    const expectedState = { [itemNew.id]: itemNew };
    expect(nextStateItem[STATUS].validationStatus).to.eql(validationStatus.INVALID);
    expect(nextStateItem[STATUS].busyStatus).to.eql(busyStatus.BUSY);
    delete nextStateItem[STATUS];
    expect(nextState).to.shallowDeepEqual(expectedState);
    expect(nextStateItem).to.deep.equal(itemNew);
  });

  it('removes item from state on object removing', () => {
    const initialState = {
      1: { id: 1 },
      2: { id: 2 },
    };
    const schema = 'schema_test';
    const action = {
      type: OBJECT_REMOVING,
      payload: { id: 1 },
      meta: {
        schema,
      },
    };
    const reducer = storage(schema, initialState);
    deepFreeze(initialState);
    const nextState = reducer(initialState, action);
    const expectedState = {
      2: { id: 2 },
    };

    expect(nextState).to.shallowDeepEqual(expectedState);
  });

  it('ignores custom action with correct meta schema but invalid item', () => {
    const initialState = {};
    const item = { name: 1 };
    const schema = 'schema_test';
    const action = {
      type: 'CUSTOM_ACTION',
      meta: {
        schema,
        tag: 'custom tag',
      },
      payload: item,
    };
    const reducer = storage(schema, initialState);
    deepFreeze(initialState);
    const nextState = reducer(initialState, action);
    const expectedState = {};
    const nextStateItem = nextState[item.id];

    expect(nextState).to.shallowDeepEqual(expectedState);
    expect(nextStateItem).to.be.undefined;
  });

  it('ignores correct action with correct meta schema but invalid item', () => {
    const initialState = {};
    const item = { name: 1 };
    const schema = 'schema_test';
    const action = {
      type: OBJECT_FETCHED,
      meta: {
        schema,
      },
      payload: item,
    };
    const reducer = storage(schema, initialState);
    deepFreeze(initialState);

    const nextState = reducer(initialState, action);
    const expectedState = {};
    const nextStateItem = nextState[item.id];

    expect(nextState).to.shallowDeepEqual(expectedState);
    expect(nextStateItem).to.be.undefined;
  });

  it('ignores correct action with correct meta schema but undefined item', () => {
    const initialState = {};
    const schema = 'schema_test';
    const action = {
      type: OBJECT_FETCHED,
      meta: {
        schema,
      },
      payload: undefined,
    };
    const reducer = storage(schema, initialState);
    deepFreeze(initialState);

    const nextState = reducer(initialState, action);
    const expectedState = {};

    expect(nextState).to.shallowDeepEqual(expectedState);
  });

  it('applies transformation from action into item in storage on fetched', () => {
    const initialState = {};
    const item = { id: 1 };
    const schema = 'schema_test';
    const transformation = {
      a: 'a',
      b: 'b',
    };
    const action = {
      type: OBJECT_FETCHED,
      meta: {
        schema,
        transformation,
      },
      payload: item,
    };
    const reducer = storage(schema, initialState);
    deepFreeze(initialState);

    const nextState = reducer(initialState, action);
    const expectedState = { [item.id]: item };
    const nextStateItem = nextState[item.id];

    expect(nextState).to.shallowDeepEqual(expectedState);
    expect(nextStateItem).to.deep.equal(item);
    expect(nextStateItem[STATUS].validationStatus).to.eql(validationStatus.VALID);
    expect(nextStateItem[STATUS].busyStatus).to.eql(busyStatus.IDLE);
    expect(nextStateItem[STATUS].transformation).to.eql(transformation);
  });

  it('applies transformation from action into item in storage on updated', () => {
    const item = { id: 1, value: 'a', control: 'c' };
    const transformation = { a: 'a' };
    item[STATUS] = updateStatus(createStatus(), transformation);
    const initialState = { [item.id]: item };
    const schema = 'schema_test';
    const reducer = storage(schema, initialState);
    deepFreeze(initialState);

    const itemNew = { id: 1, value: 'b' };
    const transformationNew = { b: 'b' };
    const action = {
      type: OBJECT_UPDATED,
      meta: {
        schema,
        transformation: transformationNew,
      },
      payload: itemNew,
    };

    const nextState = reducer(initialState, action);
    const nextStateItem = nextState[item.id];

    const expectedState = { [itemNew.id]: itemNew };
    expect(nextState).to.shallowDeepEqual(expectedState);
    expect(nextStateItem).to.deep.equal(itemNew);
    expect(nextStateItem[STATUS].validationStatus).to.eql(validationStatus.VALID);
    expect(nextStateItem[STATUS].busyStatus).to.eql(busyStatus.IDLE);
    expect(nextStateItem[STATUS].transformation).to.eql(transformationNew);
  });

  it('applies transformation from action into item in storage on updating', () => {
    const item = {
      id: 2,
      type: 'a',
      attributes: {
        aa: 1,
        bb: [1, 2, 3],
      },
      relationships: {
        cc: {
          data: { id: 1, type: 'c' },
        },
        dd: {
          data: [
            { id: 1, type: 'c' },
            { id: 2, type: 'd' },
            { id: 3, type: 'e' },
          ],
        },
      },
    };
    const transformation = {
      a: 'a',
      c: {
        ff: 1,
        dd: 2,
      },
    };
    item[STATUS] = updateStatus(createStatus(), { transformation });
    const initialState = { [item.id]: item };
    const schema = 'schema_test';
    const reducer = storage(schema, initialState);
    deepFreeze(initialState);

    const itemPatch = {
      id: 2,
      type: 'a',
      attributes: {
        bb: [2],
      },
      relationships: {
        dd: {
          data: [
            { id: 2, type: 'd' },
          ],
        },
      },
    };
    const transformationPatch = {
      b: 'b',
      c: {
        ff: 2,
        cc: 5,
      },
    };
    const action = {
      type: OBJECT_UPDATING,
      meta: {
        schema,
        transformation: transformationPatch,
      },
      payload: itemPatch,
    };

    const nextState = reducer(initialState, action);
    const nextStateItem = nextState[item.id];

    const expectedItem = {
      id: 2,
      type: 'a',
      attributes: {
        aa: 1,
        bb: [2],
      },
      relationships: {
        cc: {
          data: { id: 1, type: 'c' },
        },
        dd: {
          data: [
            { id: 2, type: 'd' },
          ],
        },
      },
    };
    const expectedState = { [expectedItem.id]: expectedItem };
    expect(nextStateItem[STATUS].validationStatus).to.eql(validationStatus.INVALID);
    expect(nextStateItem[STATUS].busyStatus).to.eql(busyStatus.BUSY);
    expect(nextStateItem[STATUS].transformation).to.eql(_.merge({},
      transformation,
      transformationPatch
    ));
    delete nextStateItem[STATUS];
    expect(nextState).to.shallowDeepEqual(expectedState);
    expect(nextStateItem).to.deep.equal(expectedItem);
  });
});