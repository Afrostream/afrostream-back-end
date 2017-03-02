const assert = require('better-assert');

const filters = rootRequire('app/api/v1/rest/filters.js');

const utils = rootRequire('app/api/v1/rest/utils');

const { rewriteQuery } = rootRequire('app/api/shared/rest/utils');

const sqldb = rootRequire('sqldb');
const Item = sqldb.Item;
const ElementSerie = sqldb.ElementSerie;
const ElementSeason = sqldb.ElementSeason;

const Q = require('q');
const _ = require('lodash');

const populateToIncludedModel = populate => {
  assert(Array.isArray(populate));

  const include = [];

  // item is mandatory.
  populate.push('item')
  // uniq
  populate = _.uniq(populate);

  populate.forEach(pop => {
    switch (pop) {
      case 'item':
        include.push({
          model: Item,
          as: 'item',
          required: true
        });
        break;
      case 'seasons':
        include.push({
          model: ElementSeason,
          as: 'seasons',
          required: false,
          include: [
            {
              model: Item,
              as: 'item',
              required: true
            }
          ]
        });
        break;
      default: break;
    }
  });
  return include;
};

/*
 * @param string populate   comma separated list of associations to populate
 *                          default is ?populate=item
 */
module.exports.index = (req, res) => {
  Q()
    .then(() => {
      let query = rewriteQuery(req.query);

      // l'api remonte forcement l'item d'un element.
      let queryOptions = {
        limit: query.limit,
        offset: query.offset,
        include: populateToIncludedModel(query.populate)
      };

      queryOptions = filters.filterQueryOptions(req, queryOptions, ElementSerie);
      //
      return ElementSerie.findAndCountAll(queryOptions);
    })
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResultAndTotal(req, res))
    .catch(res.handleError());
};

module.exports.show = (req, res) => {
  Q()
    .then(() => {
      let query = rewriteQuery(req.query);

      let queryOptions = {
        where: { _id: req.params.id },
        include: populateToIncludedModel(query.populate)
      };

      queryOptions = filters.filterQueryOptions(req, queryOptions, ElementSerie);

      console.log(require('util').inspect(queryOptions, {depth: null}));

      // l'api remonte forcement l'item d'un element.
      return ElementSerie.findOne(queryOptions);
    })
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};
