const sqldb = rootRequire('sqldb');
const MailerList = sqldb.MailerList;
const MailerProvider = sqldb.MailerProvider;

const _ = require('lodash');
const filters = rootRequire('app/api/filters.js');
const utils = rootRequire('app/api/utils.js');

exports.index = (req, res) => {
  const queryName = req.param('query');

  let queryOptions = {
    order: [['name']],
    include: [
      { model: MailerProvider, as: 'providers', required: false }
    ]
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
  queryOptions = filters.filterQueryOptions(req, queryOptions, MailerList);
  //
  MailerList.findAndCountAll(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResultAndTotal(req, res))
    .catch(res.handleError());
};

exports.show = (req, res) => {
  let queryOptions = {
    where: {
      _id: req.params.id
    },
    include: [
      { model: MailerProvider, as: 'providers', required: false }
    ]
  };
  //
  queryOptions = filters.filterQueryOptions(req, queryOptions, MailerList);
  //
  MailerList.find(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};

exports.create = (req, res) => {
  MailerList.create(req.body)
    .then(utils.responseWithResult(req, res, 201))
    .catch(res.handleError());
};

exports.update = (req, res) => {
  if (req.body._id) {
    delete req.body._id;
  }
  MailerList.find({
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
  MailerList.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(entity => entity.destroy)
    .then(() => res.status(204).end())
    .catch(res.handleError());
};
