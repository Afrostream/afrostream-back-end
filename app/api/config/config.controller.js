'use strict';
var sqldb = rootRequire('/sqldb');
var config = rootRequire('/config');
var utils = rootRequire('/app/api/utils.js');
var Config = sqldb.Config;

function mapEntitys () {
  return function (entity) {
    //Map values
    var mxVals = entity.map(function (r) {
      return r.dataValues.maximum;
    });

    return Config.findAll({
      where: {
        '_id': {
          $in: mxVals
        }
      }
    });
  };
}

function responseWithResult (res, statusCode) {
  statusCode = statusCode || 200;
  return function (entity) {
    if (entity) {
      res.status(statusCode).json(entity);
    }
  };
}

function removeEntity (res) {
  return function (entity) {
    if (entity) {
      return entity.destroy()
        .then(function () {
          res.status(204).end();
        });
    }
  };
}

// Creates a new actor in the DB
exports.client = function (req, res) {
  res.json(config.client);
};

// Gets a list of clients
exports.index = function (req, res) {

  var paramsObj = utils.mergeReqRange({
    attributes: [[
      sqldb.sequelize.fn('max', sqldb.sequelize.col('_id')), 'maximum']],
    group: ['target']
  }, req);

  Config.findAll(paramsObj)
    .then(mapEntitys())
    .then(responseWithResult(res))
    .catch(res.handleError());

};

// Gets a single client from the DB
exports.target = function (req, res) {
  Config.find({
      where: {
        target: req.params.target
      },
      max: '_id',
      order: [
        ['_id', 'DESC']
      ]
    })
    .then(utils.handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(res.handleError());
};

// Creates a new client in the DB
exports.create = function (req, res) {
  Config.create(req.body)
    .then(responseWithResult(res, 201))
    .catch(res.handleError());
};

// Deletes a client from the DB
exports.destroy = function (req, res) {
  Config.find({
      where: {
        _id: req.params.id
      }
    })
    .then(utils.handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(res.handleError());
};
