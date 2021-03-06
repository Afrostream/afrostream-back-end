/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/life/spots              ->  index
 * LifeSpot    /api/life/spots              ->  create
 * GET     /api/life/spots/:id          ->  show
 * PUT     /api/life/spots/:id          ->  update
 * DELETE  /api/life/spots/:id          ->  destroy
 */

'use strict';

const _ = require('lodash');
const sqldb = rootRequire('sqldb');
const Image = sqldb.Image;
const LifeSpot = sqldb.LifeSpot;
const LifeTheme = sqldb.LifeTheme;
const filters = rootRequire('app/api/filters.js');
const utils = rootRequire('app/api/utils.js');

const getIncludedModel = require('./spot.includedModel').get;

function saveUpdates (updates) {
  return entity => entity.updateAttributes(updates);
}

function updateImages (updates) {
  return entity => {
    const promises = [];
    promises.push(entity.setImage(updates.image && updates.image.dataValues && Image.build(updates.image.dataValues) || updates.image && Image.build(updates.image) || null));
    return sqldb.Sequelize.Promise
      .all(promises)
      .then(() => entity);
  };
}

function removeEntity (res) {
  return entity => {
    if (entity) {
      return entity.destroy()
        .then(() => {
          res.status(204).end();
        });
    }
  };
}

function addThemes (updates) {
  const themes = LifeTheme.build(_.map(updates.themes || [], _.partialRight(_.pick, '_id')));
  return entity => {
    if (!themes || !themes.length) {
      return entity;
    }
    return entity.setThemes(themes)
      .then(() => entity);
  };
}

// Gets a list of life/spots
// ?query=... (search in the title)
exports.index = (req, res) => {
  const queryName = req.query.query;
  const queryType = req.query.type;
  const queryThemeId = req.query.themeId;

  let includeThemesModel = {
    model: LifeTheme,
    as: 'themes',
    attributes: [
      '_id',
      'label',
      'slug',
      'sort'
    ],
    required: false
  };

  //SearchBy themes
  if (queryThemeId) {
    includeThemesModel = _.merge(includeThemesModel, {
      where: {
        _id: queryThemeId
      }
    });
  }

  let queryOptions = {
    include: [
      includeThemesModel, {
        model: Image,
        as: 'image',
        required: false
      }
    ]
  };


  // pagination
  utils.mergeReqRange(queryOptions, req);


  if (queryName) {
    queryOptions = _.merge(queryOptions, {
      where: {
        title: {
          $iLike: '%' + queryName + '%'
        }
      }
    });
  }
  if (queryType) {
    queryOptions = _.merge(queryOptions, {
      where: {
        type: {
          $iLike: '%' + queryType + '%'
        }
      }
    });
  }

  queryOptions = filters.filterQueryOptions(req, queryOptions, LifeSpot);

  LifeSpot.findAndCountAll(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResultAndTotal(req, res))
    .catch(res.handleError());
};

// Gets a single LifeSpot from the DB
exports.show = (req, res) => {
  let queryOptions = {
    where: {
      _id: req.params.id
    },
    include: getIncludedModel()
  };

  queryOptions = filters.filterQueryOptions(req, queryOptions, LifeSpot);

  LifeSpot.find(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};

// Creates a new LifeSpot in the DB
exports.create = (req, res) => LifeSpot.create(req.body)
  .then(updateImages(req.body))
  .then(addThemes(req.body))
  .then(utils.responseWithResult(req, res, 201))
  .catch(res.handleError());

// Updates an existing LifeSpot in the DB
exports.update = (req, res) => {
  if (req.body._id) {
    delete req.body._id;
  }
  LifeSpot.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(updateImages(req.body))
    .then(addThemes(req.body))
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};

// Deletes a LifeSpot from the DB
exports.destroy = (req, res) => {
  LifeSpot.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(res.handleError());
};
