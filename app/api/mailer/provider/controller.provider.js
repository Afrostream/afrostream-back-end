const sqldb = rootRequire('sqldb');
const MailerProvider = sqldb.MailerProvider;

const _ = require('lodash');
const filters = rootRequire('app/api/filters.js');
const utils = rootRequire('app/api/utils.js');

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
  queryOptions = filters.filterQueryOptions(req, queryOptions, MailerProvider);
  //
  MailerProvider.findAndCountAll(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResultAndTotal(req, res))
    .catch(res.handleError());
};

exports.show = (req, res) => {
  let queryOptions = {
    where: {
      _id: req.params.id
    }
  };
  //
  queryOptions = filters.filterQueryOptions(req, queryOptions, MailerProvider);
  //
  MailerProvider.find(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};

exports.create = (req, res) => {
  MailerProvider.create(req.body)
    .then(utils.responseWithResult(req, res, 201))
    .catch(res.handleError());
};

exports.update = (req, res) => {
  if (req.body._id) {
    delete req.body._id;
  }
  MailerProvider.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(entity => entity.updateAttributes(req.body))
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};

exports.destroy = (req, res) => {
  MailerProvider.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(entity => entity.destroy)
    .then(() => res.status(204).end())
    .catch(res.handleError());
};
