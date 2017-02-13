const _ = require('lodash');
const Q = require('q');
const sqldb = rootRequire('sqldb');
const LifeUsersFollowers = sqldb.LifeUsersFollowers;
const LifeUser = sqldb.LifeUser;

const filters = rootRequire('/app/api/filters');

module.exports.update = (req, res) => {
  const lifeUserFollowKey = {userId: req.user._id, followUserId: req.params.followUserId};
  const data = _.merge({}, req.body, lifeUserFollowKey);

  Q()
    .then(() => LifeUsersFollowers.findOne({where: lifeUserFollowKey}))
    .then(function upsert (lifeUserFollow) {
      // manual upsert, non atomic, but avoid heroku posgres log
      // 2016-03-29T10:28:27Z app[postgres.24289]: [DATABASE] statement: CREATE OR REPLACE FUNCTION pg_temp.sequelize_upsert()...
      if (!lifeUserFollow) {
        return LifeUsersFollowers.create(data);
      } else {
        return lifeUserFollow.updateAttributes(data);
      }
    })
    .then((lifeUserFollow) => {
      // should be in a model hook (trigger like feature)
      return Q.all([
        LifeUser.findOne({where: {_id: req.params.userId}}),
        LifeUsersFollowers.count({where: {followUserId: req.params.followUserId, follow: true}})
      ])
        .then(([lifeFollowUser, followers]) => {
          if (!lifeFollowUser) {
            const error = new Error('unknown followUserId');
            error.statusCode = 404;
            throw error;
          }
          return LifeUser.update({followers: followers || 0});
        })
        .then(() => lifeUserFollow);
    })
    .then(
      res.json.bind(res),
      res.handleError()
    );
};

module.exports.show = (req, res) => {
  LifeUsersFollowers.find({where: {userId: req.user._id, followUserId: req.params.followUserId}})
    .then(
      lifeUserFollow => {
        if (!lifeUserFollow) {
          const error = new Error('not found');
          error.statusCode = 404;
          throw error;
        }
        return lifeUserFollow;
      }
    )
    .then(
      res.json.bind(res),
      res.handleError()
    );
};

module.exports.index = (req, res) => {
  let queryOptions = {
    where: {followUserId: req.user._id},
    order: [['updatedAt', 'desc']]
  };

  if (typeof req.query.follow !== 'undefined') {
    queryOptions = _.merge(queryOptions, {where: {follow: (req.query.follow === "true")}});
  }

  queryOptions = filters.filterQueryOptions(req, queryOptions, LifeUsersFollowers);

  LifeUsersFollowers.findAll(queryOptions)
    .then(
      data => {
        res.json(data || []);
      },
      res.handleError()
    );
};
