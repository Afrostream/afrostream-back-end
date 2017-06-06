const sqldb = rootRequire('sqldb');

const Mailer = rootRequire('mailer');

const _ = require('lodash');
const filters = rootRequire('app/api/filters.js');
const utils = rootRequire('app/api/utils.js');

/*
 * In this file, we never manipulate on UPDATE/DELETE the database directly.
 *  we always pass by the Mailer classes.
 *
 * Architecture:
 *    API CRUD => [Mailer] => (...)
 */
exports.index = (req, res) => {
  const queryName = req.param('query');

  let queryOptions = {
    order: [['name']]
  };

  // pagination
  utils.mergeReqRange(queryOptions, req);

  if (queryName) {
    queryOptions = _.merge(queryOptions, {
      where: sqldb.Sequelize.or({
        firstName: {$iLike: '%' + queryName + '%'}
      }, {
        lastName: {$iLike: '%' + queryName + '%'}
      })
    });
  }
  //
  queryOptions = filters.filterQueryOptions(req, queryOptions, Mailer.List.getDBModel());

  Mailer.List.find(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResultAndTotal(req, res))
    .catch(res.handleError());
};

exports.show = (req, res) => {
  Mailer.List.loadById(req.params.id)
    .then(mailerList => mailerList.getModel())
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};

exports.create = (req, res) => {
  Mailer.List.create(req.body)
    .then(mailerList => res.status(201).json(mailerList))
    .catch(res.handleError());
};

exports.update = (req, res) => {
  Mailer.List.loadById(req.params._id)
    .then(mailerList => {
      return mailerList.update(req.body);
    })
    .then(mailerList => res.status(200).json(mailerList))
    .catch(res.handleError());
};

exports.destroy = (req, res) => {
  Mailer.List.destroy(req.params._id)
    .then(() => res.status(204).end())
    .catch(res.handleError());
};
