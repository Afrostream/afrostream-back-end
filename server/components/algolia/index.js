'use strict';

var BluebirdPromise = require('bluebird');
var config = require('../../config/environment');
var algoliasearch = require('algoliasearch');
var client = algoliasearch(config.algolia.appId, config.algolia.apiKey);

exports = module.exports = {
  importAll: function (res, indexName) {
    return function (entitys) {
      var index = client.initIndex(indexName);
      //return BluebirdPromise.map(entitys, function (entity) {
      // let's use table IDS as Algolia objectIDs
      var datas = entitys.map(function (result) {
        result.objectID = result._id;
        return result;
      });

      var saveAsync = BluebirdPromise.promisify(index.saveObjects, index);
      return saveAsync(datas);
    };
  },
  handleError: function (res) {
    return function (err) {
      res.status(500).send(err);
    };
  }
};
