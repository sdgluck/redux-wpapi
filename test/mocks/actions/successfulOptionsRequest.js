import { REDUX_WP_API_SUCCESS } from '../../../src/constants/actions';
import optionsResponse from '../data/optionsResponse';

export default {
  type: REDUX_WP_API_SUCCESS,
  payload: {
    cacheID: '/wp/v2/options',
    page: 1,
    response: optionsResponse,
  },
  meta: {
    name: 'test',
    aggregator: 'options',
    requestAt: Date.now(),
    responseAt: Date.now(),
    operation: 'get',
  },
};
