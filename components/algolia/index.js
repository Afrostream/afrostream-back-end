var config = rootRequire('config');
var algoliasearch = require('algoliasearch');
var client = algoliasearch(config.algolia.appId, config.algolia.apiKey);

var Q = require('q');

// FIXME: refactorer tout ca ...
// les handlers d'error ne retournent rien ! (pas de fwd de l'erreur ??);
//   ne passe pas par le handler d'error generique
//   (etc...)
exports = module.exports = {
  importAll: function (res, indexName) {
    return function (entitys) {
      if (entitys) {
        var index = client.initIndex(indexName);
        // let's use table IDS as Algolia objectIDs
        var datas = entitys.map(function (result) {
          result.objectID = result._id;
          return result;
        });
        return Q.ninvoke(index, 'saveObjects', datas);
      }
    };
  },

  searchIndex: function (indexName, querystring) {
    var index = client.initIndex(indexName);
    return Q.ninvoke(index, 'search', querystring);
  },

  searchQueries: function (queries) {
    return Q.ninvoke(client, 'search', queries);
  },

  handleError: function (res) {
    return function (err) {
      res.status(500).send(err);
    };
  }
};
