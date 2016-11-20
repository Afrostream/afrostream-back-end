'use strict';
var Promise = require('bluebird');
var config = rootRequire('/config');
var _ = require('lodash');
var algoliasearch = require('algoliasearch');
var client = algoliasearch(config.algolia.appId, config.algolia.apiKey);

var logger = rootRequire('logger').prefix('ALGOLIA');

// FIXME: refactorer tout ca ...
// les handlers d'error ne retournent rien ! (pas de fwd de l'erreur ??);
//   ne passe pas par le handler d'error generique
//   (etc...)
exports = module.exports = {
  importAll: function (res, indexName) {
    return function (entitys) {
      if (entitys) {
        var index = client.initIndex(indexName);
        //return Promise.map(entitys, function (entity) {
        // let's use table IDS as Algolia objectIDs
        var datas = entitys.map(function (result) {
          result.objectID = result._id;
          return result;
        });

        var saveAsync = Promise.promisify(index.saveObjects, index);
        return saveAsync(datas).then(function (items) {
          return items;
        }).catch(function (err) {
          logger.error(err)
        });
      }
    }
  },

  searchIndex: function (indexName, querystring) {
    var index = client.initIndex(indexName);

    var searchAsync = Promise.promisify(index.search, index);
    return searchAsync(querystring);
  },

  handleError: function (res) {
    return function (err) {
      res.status(500).send(err);
    };
  }
};
