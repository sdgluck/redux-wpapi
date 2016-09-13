export default (actionTarget, override) => {
  class Adapter {
    getAggregator() { return actionTarget.meta.aggregator; }
    getOperation() { return actionTarget.meta.operation; }
    generateCacheID() { return actionTarget.payload.cacheID; }
    getRequestedPage() { return actionTarget.payload.page; }

    getUrl() { return ''; }
    getIndexes() { return {}; }
    buildRequest() { return Promise.resolve(); }
  }

  Object.assign(Adapter.prototype, override);
  return new Adapter();
};

