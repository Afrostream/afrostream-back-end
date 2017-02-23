const _ = require('lodash');
const Q = require('q');
const sqldb = rootRequire('sqldb');
const LifeUsersPins = sqldb.LifeUsersPins;
const LifePin = sqldb.LifePin;

const filters = rootRequire('app/api/v1/rest/filters');

module.exports.update = (req, res) => {
  const lifeUserPinKey = { userId: req.user._id, pinId: req.params.pinId};
  const data = _.merge({}, req.body, lifeUserPinKey);

  Q()
    .then(() => LifeUsersPins.findOne({where: lifeUserPinKey}))
    .then(function upsert(lifeUserPin) {
      // manual upsert, non atomic, but avoid heroku posgres log
      // 2016-03-29T10:28:27Z app[postgres.24289]: [DATABASE] statement: CREATE OR REPLACE FUNCTION pg_temp.sequelize_upsert()...
      if (!lifeUserPin) {
        return LifeUsersPins.create(data);
      } else {
        return lifeUserPin.updateAttributes(data);
      }
    })
    .then((lifeUserPin) => {
      // should be in a model hook (trigger like feature)
      return Q.all([
        LifePin.findOne({where:{_id: req.params.pinId}}),
        LifeUsersPins.count({where:{pinId: req.params.pinId, liked:true}})
      ])
      .then(([lifePin, likes]) => {
        if (!lifePin) {
          const error = new Error('unknown pin');
          error.statusCode = 404;
          throw error;
        }
        return lifePin.update({likes:likes || 0});
      })
      .then(() => lifeUserPin);
    })
    .then(
      res.json.bind(res),
      res.handleError()
    );
};

module.exports.show = (req, res) => {
  LifeUsersPins.find({ where: { userId: req.user._id, pinId: req.params.pinId } })
    .then(
      lifeUserPin => {
        if (!lifeUserPin) {
          const error = new Error('not found');
          error.statusCode = 404;
          throw error;
        }
        return lifeUserPin;
      }
    )
    .then(
      res.json.bind(res),
      res.handleError()
    );
};

module.exports.index = (req, res) => {
  let queryOptions = {
    where: { userId: req.user._id },
    order: [ ['updatedAt', 'desc'] ]
  };

  if (typeof req.query.liked !== 'undefined') {
    queryOptions = _.merge(queryOptions, { where: { liked: (req.query.liked === "true") } } );
  }

  queryOptions = filters.filterQueryOptions(req, queryOptions, LifeUsersPins);

  LifeUsersPins.findAll(queryOptions)
    .then(
      data => { res.json(data || []); },
      res.handleError()
    );
};
