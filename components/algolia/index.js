var _ = require('lodash');
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

      const removeEmptyObjects = function (obj) {
        return function prune (current) {
          _.forOwn(current, function (value, key) {
            if (_.isUndefined(value) || _.isNull(value) || _.isNaN(value) ||
              (_.isString(value) && _.isEmpty(value)) ||
              (_.isObject(value) && _.isEmpty(prune(value)))) {

              delete current[key];
            }
          });
          // remove any leftover undefined values from the delete
          // operation on an array
          if (_.isArray(current)) _.pull(current, undefined);

          return current;

        }(_.cloneDeep(obj));  // Do not modify the original object, create a clone instead
      };

      if (entitys) {
        var index = client.initIndex(process.env.NODE_ENV + '_' + indexName);
        // let's use table IDS as Algolia objectIDs
        var datas = entitys.map(function (result) {
          var item = removeEmptyObjects(result.toJSON());
          item.objectID = result._id;
          return item;
        });
        return Q.ninvoke(index, 'saveObjects', datas);
      }
    };
  },

  searchIndex: function (indexName, querystring) {
    //FIXME when export Algolia en prod, replace this line
    // var index = client.initIndex(process.env.NODE_ENV + '_' + indexName);
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
