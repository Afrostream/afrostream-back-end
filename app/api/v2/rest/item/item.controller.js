const filters = rootRequire('app/api/v1/rest/filters.js');

const utils = rootRequire('app/api/v1/rest/utils');

const {
  rewriteQuery
} = rootRequire('app/api/shared/rest/utils');

const sqldb = rootRequire('sqldb');
const Item = sqldb.Item;

const Q = require('q');

module.exports.index = (req, res) => {
  Q()
    .then(() => {
      let query = rewriteQuery(req.query);

      let queryOptions = {
        limit: query.limit,
        offset: query.offset
      };

      // on veut charger les infos "element"
      if (query.populate.indexOf('element') !== -1 && query.type &&
        typeof sqldb.elements[query.type] !== 'undefined') {
        const element = sqldb.elements[query.type];

        queryOptions.include = [{
          model: element.model,
          as: element.elementName,
          required: true
        }];
      }

      queryOptions = filters.filterQueryOptions(req, queryOptions, Item);

      //
      return Item.findAndCountAll(queryOptions);
    })
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResultAndTotal(req, res))
    .catch(res.handleError());
};

module.exports.show = (req, res) => {
  Q()
    .then(() => {
      // first: read the item.
      return Item.findById(req.params.id);
    })
    .then(utils.handleEntityNotFound(res))
    .then(item => {
      let query = rewriteQuery(req.query);

      if (query.populate.indexOf('element') !== -1) {
        const element = sqldb.elements[item.type];

        return Item.findOne({
          where: {
            _id: req.params.id
          },
          include: [{
            model: element.model,
            as: element.elementName,
            required: true
          }]
        });
      }
      return item;
    })
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};
