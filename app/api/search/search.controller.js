'use strict';

const sqldb = rootRequire('sqldb');
const Promise = sqldb.Sequelize.Promise;
const algolia = rootRequire('components/algolia');
const Movie = sqldb.Movie;
const Actor = sqldb.Actor;
const LifePin = sqldb.LifePin;
const filters = rootRequire('app/api/filters.js');

const movieIncludedModels = require('../movie/movie.includedModel').getSearch;
const lifePinsIncludedModels = require('../life/pin/pin.includedModel').get;
const actorIncludedModels = require('../actor/actor.includedModel').get;


/*
 * on imite le resultat d'algolia
 * {
 *   hits: [{sharing: {url: "https://afrostream.tv/sharing/movie/149"}, duration: 6238, rating: 5, _id: 149,…},…],
 *   hitsPerPage: 20,
 *   nbHits: 8,
 *   nbPages: 1,
 *   page:0,
 *   params: "query=ali",
 *   query: "ali"
 * }
 */
exports.search = (req, res) => {
  const query = req.body.query || '';

  const hitsPerPage = 10;
  const models = [{
    name: process.env.NODE_ENV + '_Movie',
    model: Movie,
    include: movieIncludedModels()
  }, {
    name: process.env.NODE_ENV + '_LifePin',
    model: LifePin,
    include: lifePinsIncludedModels()
  }, {
    name: process.env.NODE_ENV + '_Actor',
    model: Actor,
    include: actorIncludedModels()
  }];

  const queries = models.map((model) => {
    return {
      indexName: model.name,
      query: query,
      params: {
        hitsPerPage: hitsPerPage,
      }
    };
  });

  algolia.searchQueries(queries)
    .then(res => {
      if (!res) {
        throw new Error('no result from algolia');
      }

      const promises = [];
      const results = res.results;

      (results || []).map((result, key) => {


        promises.push(new Promise(resolve => {

          const modelInstance = models[key].model;

          let queryOptions = {
            where: {
              _id: {
                $in: (result.hits || []).map(entity => entity._id)
              }
            },
            include: models[key].include
          };

          queryOptions = filters.filterQueryOptions(req, queryOptions, modelInstance);

          const c = modelInstance.findAll(queryOptions)
            .then(entity => {
              return filters.filterOutput(entity, {req: req});
            })
            .then(entity => {
              result.hits = entity;
              result.nbHits = entity.length;
              return result;
            });

          resolve(c);
        }));
      });

      return Promise
        .all(promises)
        .then(entityFiltered => ({
          count: entityFiltered.length,
          rows: entityFiltered
        }));
    })
    .then(
      res.json.bind(res),
      res.handleError()
    );
};
