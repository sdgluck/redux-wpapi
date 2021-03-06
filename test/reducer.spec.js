import { describe, it } from 'mocha';
import expect from 'expect';
import Immutable from 'immutable';
import ReduxWPAPI from '../src/index.js';
import { pending, resolved, rejected } from '../src/constants/requestStatus';

import * as Symbols from '../src/symbols';
import collectionRequest from './mocks/actions/collectionRequest';
import modifyingRequest from './mocks/actions/modifyingRequest';
import successfulCollectionRequest from './mocks/actions/successfulCollectionRequest';
import successfulQueryBySlug from './mocks/actions/successfulQueryBySlug';
import successfulOptionsRequest from './mocks/actions/successfulOptionsRequest';
import unsuccessfulCollectionRequest from './mocks/actions/unsuccessfulCollectionRequest';
import unsuccessfulModifyingRequest from './mocks/actions/unsuccessfulModifyingRequest';
import cacheHitSingle from './mocks/actions/cacheHitSingle';
import cacheHitCollection from './mocks/actions/cacheHitCollection';
import AdapterMockForReducer from './mocks/AdapterMockForReducer';

describe('Reducer', () => {
  const modifyingOperations = ['create', 'update', 'delete'];
  let reducer;

  beforeEach(() => {
    reducer = new ReduxWPAPI({
      adapter: new AdapterMockForReducer(),
      customCacheIndexes: {
        any: 'slug',
      },
    }).reducer;
  });

  it('should have the right Immutable instances for its initial state', () => {
    const initialState = reducer(undefined, {});
    expect(initialState).toBeA(Immutable.Map);
    expect(initialState.get('resources')).toBeA(Immutable.List);
    expect(initialState.get('resourcesIndexes')).toBeA(Immutable.Map);
    expect(initialState.get('requestsByQuery')).toBeA(Immutable.Map);
    expect(initialState.get('requestsByName')).toBeA(Immutable.Map);
  });

  it('shouldnt change state for irrelant actions', () => {
    const initialState = reducer(undefined, {});
    expect(reducer(initialState, { type: 'NO-OP ACTION' }))
    .toBe(initialState);
  });

  describe('`REDUX_WP_API_REQUEST` action', () => {
    describe('operation GET', () => {
      it('should keep request related data by query\'s cacheID', () => {
        const state = reducer(undefined, collectionRequest);
        const queryState = state.getIn(['requestsByQuery', collectionRequest.payload.cacheID]);
        expect(queryState).toBeAn(Immutable.Map);
        expect(queryState.get('pagination')).toNotBeAn(Immutable.Map);
        expect(queryState.get(collectionRequest.payload.page)).toBeAn(Immutable.Map);
        expect(queryState.get(collectionRequest.payload.page).toJSON())
        .toEqual({
          status: pending,
          operation: collectionRequest.meta.operation,
          requestAt: collectionRequest.meta.requestAt,
        });

        expect(queryState.getIn([collectionRequest.payload.page, 'data']))
        .toBe(undefined, 'shouldnt touch data');
      });

      it('should keep by request name the enought data to reach query', () => {
        const state = reducer(undefined, collectionRequest);
        const nameState = state.getIn(['requestsByName', collectionRequest.meta.name]);

        expect(nameState.get('page')).toBe(collectionRequest.payload.page);
        expect(nameState.get('cacheID')).toBe(collectionRequest.payload.cacheID);
      });

      it('should keep previous data under query', () => {
        const firstState = reducer(undefined, collectionRequest);
        const secondState = reducer(firstState, successfulCollectionRequest);
        const thirdState = reducer(secondState, {
          ...collectionRequest,
          meta: {
            ...collectionRequest.meta,
            // request renewed
            requestAt: Date.now(),
          },
        });

        expect(thirdState.getIn(['requestsByQuery', collectionRequest.payload.cacheID, 'data']))
        .toBe(secondState.getIn(['requestsByQuery', collectionRequest.payload.cacheID, 'data']));
      });
    });

    modifyingOperations
    .forEach(type =>
      describe(`on operation ${type.toUpperCase()}`, () => {
        const request = { ...modifyingRequest, meta: { ...modifyingRequest.meta, type } };
        it('should keep request related data by request name', () => {
          const state = reducer(undefined, request);
          const nameState = state.getIn(['requestsByName', request.meta.name]);
          expect(nameState).toBeAn(Immutable.Map);
          expect(nameState.toJSON())
          .toEqual({
            status: pending,
            operation: request.meta.operation,
            requestAt: request.meta.requestAt,
            data: false,
          });
        });
      })
    );
  });

  describe('`REDUX_WP_API_SUCCESS` action', () => {
    it('should keep request related data by query\'s cacheID for GET operations', () => {
      const state = reducer(undefined, successfulCollectionRequest);
      const queryState = state.getIn([
        'requestsByQuery',
        successfulCollectionRequest.payload.cacheID,
      ]);

      expect(queryState).toBeAn(Immutable.Map);
      expect(queryState.get('pagination'))
      .toNotBeAn(Immutable.Map)
      .toEqual({
        total: 2,
        totalPages: 1,
      });
      expect(queryState.get(successfulCollectionRequest.payload.page)).toBeAn(Immutable.Map);

      const data = queryState.getIn([successfulCollectionRequest.payload.page, 'data']);
      expect(queryState.get(successfulCollectionRequest.payload.page).toJSON())
      .toInclude({
        status: resolved,
        error: false,
        responseAt: successfulCollectionRequest.meta.responseAt,
      });

      expect(data).toBeAn(Array);
      expect(data.length).toBe(2);

      const resource = state.getIn(['resources', data[0]]);
      expect(resource[Symbols.lastCacheUpdate]).toBe(successfulCollectionRequest.meta.responseAt);
      expect(resource[Symbols.partial]).toBe(false);
    });

    it('should keep local ids instead objects in data, by query\'s cacheID', () => {
      const state = reducer(undefined, successfulCollectionRequest);
      const queryState = state.getIn([
        'requestsByQuery',
        successfulCollectionRequest.payload.cacheID,
      ]);
      const data = queryState.getIn([successfulCollectionRequest.payload.page, 'data']);

      expect(data).toBeAn(Array);
      expect(data.length).toBe(2);
      expect(state.getIn(['resources', data[0]]).link)
      .toBe(successfulCollectionRequest.payload.response[0].link);

      expect(state.getIn(['resources', data[1]]).link)
      .toBe(successfulCollectionRequest.payload.response[1].link);
    });

    it('should index even if there is no `id` nor customCacheIndexes in the response', () => {
      const state = reducer(undefined, successfulOptionsRequest);
      expect(state.getIn(['resources', 0]).blogname)
      .toBe(successfulOptionsRequest.payload.response[0].blogname);
    });

    it('mark as partial embedded resources', () => {
      const state = reducer(undefined, successfulCollectionRequest);
      const queryState = state.getIn([
        'requestsByQuery',
        successfulCollectionRequest.payload.cacheID,
      ]);
      const data = queryState.getIn([successfulCollectionRequest.payload.page, 'data']);
      const resource = state.getIn(['resources', data[0]]);
      const embeddedAuthor = state.getIn(['resources', resource._embedded.author]);
      const parentNotPartial = state.getIn(['resources', resource._embedded.parent]);

      expect(embeddedAuthor[Symbols.partial]).toBe(true);
      expect(parentNotPartial[Symbols.partial]).toBe(false);
    });

    it('should persist locally each found resource exactly once', () => {
      const state = reducer(undefined, successfulCollectionRequest);
      const resources = state.get('resources');
      expect(resources.size).toBe(4);
      expect(resources.toJSON().map(item => item.link))
      .toInclude(successfulCollectionRequest.payload.response[0]._embedded.author[0].link)
      .toInclude(successfulCollectionRequest.payload.response[1].link)
      .toInclude(successfulCollectionRequest.payload.response[1]._embedded.author[0].link)
      .toInclude(successfulCollectionRequest.payload.response[0].link);
    });

    it('should update previous resource\'s state', () => {
      const previous = reducer(undefined, successfulCollectionRequest);
      const state = reducer(previous, successfulQueryBySlug);
      const queryState = state.getIn(['requestsByQuery', successfulQueryBySlug.payload.cacheID]);
      const [id] = queryState.getIn([1, 'data']);
      const resource = state.getIn(['resources', id]);
      expect(resource).toContain({
        [Symbols.lastCacheUpdate]: successfulQueryBySlug.meta.responseAt,
        link: successfulQueryBySlug.payload.response[0].link,
      });
    });
  });

  describe('`REDUX_WP_API_FAILURE` action', () => {
    describe('on get operation', () => {
      it('should update state on query\'s cacheID status for GET operations', () => {
        const state = reducer(undefined, unsuccessfulCollectionRequest);
        expect(
          state.getIn([
            'requestsByQuery',
            unsuccessfulCollectionRequest.payload.cacheID,
            1,
            'status',
          ])
        ).toBe(rejected);
      });
    });

    modifyingOperations.forEach(type =>
      describe(`on ${type} operation`, () => {
        const response = {
          ...unsuccessfulModifyingRequest,
          meta: {
            ...unsuccessfulModifyingRequest.meta,
            operation: type,
          },
        };

        it('should update status on request by name', () => {
          const state = reducer(undefined, response);
          expect(
            state.getIn(['requestsByName', response.meta.name, 'status'])
          ).toBe(rejected);
        });
      })
    );
  });

  describe('`REDUX_WP_API_CACHE_HIT` action', () => {
    it('should update state under request name', () => {
      let previousState = reducer(undefined, collectionRequest);
      previousState = reducer(previousState, successfulCollectionRequest);
      const state = reducer(previousState, cacheHitSingle);
      expect(state.getIn(['requestsByName', cacheHitSingle.meta.name]).toJSON())
      .toInclude({
        cacheID: cacheHitSingle.payload.cacheID,
        page: cacheHitSingle.payload.page,
      });
    });

    it('should keep same query state', () => {
      let previousState = reducer(undefined, collectionRequest);
      previousState = reducer(previousState, successfulCollectionRequest);
      const state = reducer(previousState, cacheHitCollection);
      const { page, cacheID } = cacheHitCollection.payload;

      expect(state.getIn(['requestsByQuery', cacheID, page]))
      .toBe(previousState.getIn(['requestsByQuery', cacheID, page]));
    });

    it('should always have data as a Array under query\'s cacheID', () => {
      let state = reducer(undefined, collectionRequest);
      state = reducer(state, successfulCollectionRequest);
      state = reducer(state, cacheHitSingle);
      const { page, cacheID } = cacheHitSingle.payload;
      expect(state.getIn(['requestsByQuery', cacheID, page, 'data'])).toBeAn('array');

      state = reducer(state, cacheHitCollection);
      const { page: collectionPage, cacheID: collectionUID } = cacheHitCollection.payload;

      expect(state.getIn(['requestsByQuery', collectionUID, collectionPage, 'data']))
      .toBeAn('array');
    });
  });
});

