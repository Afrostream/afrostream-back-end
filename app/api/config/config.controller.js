'use strict';
const sqldb = rootRequire('sqldb');
const config = rootRequire('config');
const utils = rootRequire('app/api/utils.js');
const Config = sqldb.Config;

function mapEntitys () {
  return entity => {
    //Map values
    const mxVals = entity.map(r => r.dataValues.maximum);

    return Config.findAll({
      where: {
        '_id': {
          $in: mxVals
        }
      }
    });
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

// Creates a new actor in the DB
exports.client = (req, res) => {
  res.json(config.client);
};

// Gets a list of clients
exports.index = (req, res) => {

  const paramsObj = utils.mergeReqRange({
    attributes: [[
      sqldb.sequelize.fn('max', sqldb.sequelize.col('_id')), 'maximum']],
    group: ['target']
  }, req);

  Config.findAll(paramsObj)
    .then(mapEntitys())
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());

};

// Gets a single client from the DB
exports.target = (req, res) => {
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
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};

// Creates a new client in the DB
exports.create = (req, res) => {
  Config.create(req.body)
    .then(utils.responseWithResult(req, res, 201))
    .catch(res.handleError());
};

// Deletes a client from the DB
exports.destroy = (req, res) => {
  Config.find({
      where: {
        _id: req.params.id
      }
    })
    .then(utils.handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(res.handleError());
};
