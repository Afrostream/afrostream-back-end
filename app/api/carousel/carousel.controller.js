/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/works              ->  index
 * POST    /api/works              ->  create
 * GET     /api/works/:id          ->  show
 * PUT     /api/works/:id          ->  update
 * DELETE  /api/works/:id          ->  destroy
 */

'use strict';

const _ = require('lodash');
const sqldb = rootRequire('sqldb');
const CarouselItem = sqldb.CarouselItem;
const Carousel = sqldb.Carousel;
const Image = sqldb.Image;
const filters = rootRequire('app/api/filters.js');
const utils = rootRequire('app/api/utils.js');

const getIncludedModel = require('./carousel.includedModel').get;

function saveUpdates (updates) {
  return entity => entity.updateAttributes(updates);
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

function updateImages (updates) {
  return entity => {
    const promises = [];
    promises.push(entity.setImage(updates.image && Image.build(updates.image) || null));
    promises.push(entity.setLogo(updates.pdf && Image.build(updates.logo) || null));
    return sqldb.Sequelize.Promise
      .all(promises)
      .then(() => entity);
  };
}

function addSlides (updates) {
  const slides = CarouselItem.build(_.map(updates.slides || [], _.partialRight(_.pick, '_id')));
  return entity => entity.setSlides(slides)
    .then(() => entity);
}

exports.index = (req, res) => {
  let queryOptions = {
    include: getIncludedModel()
  };

  // pagination
  utils.mergeReqRange(queryOptions, req);

  queryOptions = filters.filterQueryOptions(req, queryOptions, Carousel);

  Carousel.findAndCountAll(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResultAndTotal(res))
    .catch(res.handleError());
};

// Gets a single post from the DB
exports.show = (req, res) => {
  let queryOptions = {
    where: {
      _id: req.params.id || 1
    },
    include: getIncludedModel()
  };

  queryOptions = filters.filterQueryOptions(req, queryOptions, Carousel);

  Carousel.find(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResult(res))
    .catch(res.handleError());
};

// Creates a new post in the DB
exports.create = (req, res) => {
  Carousel.create(req.body)
    .then(addSlides(req.body))
    .then(utils.responseWithResult(res, 201))
    .catch(res.handleError());
};

// Updates an existing post in the DB
exports.update = (req, res) => {
  if (req.body._id) {
    delete req.body._id;
  }
  Carousel.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(addSlides(req.body))
    .then(utils.responseWithResult(res))
    .catch(res.handleError());
};

// Deletes a post from the DB
exports.destroy = (req, res) => {
  Carousel.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(res.handleError());
};
