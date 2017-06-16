const Mailer = rootRequire('mailer');

const _ = require('lodash');
const filters = rootRequire('app/api/filters.js');
const utils = rootRequire('app/api/utils.js');

const Q = require('q');

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
      where: {
        name: {$iLike: '%' + queryName + '%'}
      }
    });
  }
  //
  queryOptions = filters.filterQueryOptions(req, queryOptions, Mailer.List.getDBModel());

  Mailer.List.findAndCountAll(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResultAndTotal(req, res))
    .catch(res.handleError());
};

exports.show = (req, res) => {
  Mailer.List.loadById(req.params.listId)
    .then(mailerList => mailerList.getModel())
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};

exports.create = (req, res) => {
  Mailer.List.create(req.body)
    .then(mailerList => res.status(201).json(mailerList))
    .catch(res.handleError());
};

exports.updateQuery = (req, res) => {
  return Q()
    .then(() => {
      return Mailer.List.loadById(req.params.listId);
    })
    .then(mailerList => {
      if (mailerList.getQuery() !== req.body.query) {
        return mailerList.updateQuery(req.body.query);
      }
      return mailerList;
    })
    .then(mailerList => res.status(200).json(mailerList))
    .catch(res.handleError());
};

exports.update = (req, res) => {
  return Q()
    .then(() => {
      if (!req.body.name) {
        throw new Error('you must set a name to the list');
      }
      return Mailer.List.loadById(req.params.listId);
    })
    .then(mailerList => {
      if (mailerList.getName() !== req.body.name) {
        return mailerList.updateName(req.body.name);
      }
      return mailerList;
    })
    .then(mailerList => {
      if (mailerList.getQuery() !== req.body.query) {
        return mailerList.updateQuery(req.body.query);
      }
      return mailerList;
    })
    .then(mailerList => res.status(200).json(mailerList))
    .catch(res.handleError());
};

exports.destroy = (req, res) => {
  Mailer.List.destroy(req.params.listId)
    .then(() => res.status(204).end())
    .catch(res.handleError());
};

exports.addProvider = (req, res) => {
  Q()
    .then(() => {
      if (!req.body._id) throw new Error('missing provider _id');
    })
    .then(() => {
      return Q.all([
        Mailer.List.loadById(req.params.listId),
        Mailer.Provider.loadById(req.body._id)
      ]);
    })
    .then(([mailerList, mailerProvider]) => {
      return mailerList.addProvider(mailerProvider);
    })
    .then(
      () => Mailer.List.loadById(req.params.listId)
    )
    .then(
      mailerList => res.json(mailerList)
    )
    .catch(res.handleError());
};

exports.removeProvider = (req, res) => {
  return Q.all([
    Mailer.List.loadById(req.params.listId),
    Mailer.Provider.loadById(req.params.providerId)
  ])
  .then(([mailerList, mailerProvider]) => {
    return mailerList.removeProvider(mailerProvider);
  })
  .then(
    () => Mailer.List.loadById(req.params.listId)
  )
  .then(
    mailerList => res.json(mailerList)
  )
  .catch(res.handleError());
};

/*
 * this function run the query & create subscribers
 *
 * this can be slow.
 *
 *
 */
exports.runQuery = (req, res) => {
  Mailer.List.loadById(req.params.listId)
    .then(mailerList => {
      return mailerList.runQuery();
    })
    .then(
      r => res.json(r)
    )
    .catch(res.handleError());
};

exports.assoSubscribers = (req, res) => {
  Mailer.List.loadById(req.params.listId)
    .then(mailerList => {
      return mailerList.getAssoSubscribers({includeDisabled:true});
    })
    .then(
      r => res.json(r)
    )
    .catch(res.handleError());
};

exports.providerStartSync = (req, res) => {
  Q.all([
    Mailer.List.loadById(req.params.listId),
    Mailer.Provider.loadById(req.params.providerId)
  ])
    .then(([mailerList, mailerProvider]) => {
      return mailerList.startSync(mailerProvider);
    })
    .then(
      r => res.json(r)
    )
    .catch(res.handleError());
};

exports.providerStopSync = (req, res) => {
  Q.all([
    Mailer.List.loadById(req.params.listId),
    Mailer.Provider.loadById(req.params.providerId)
  ])
    .then(([mailerList, mailerProvider]) => {
      return mailerList.stopSync(mailerProvider);
    })
    .then(
      r => res.json(r)
    )
    .catch(res.handleError());
};

exports.providerGetSyncStatus = (req, res) => {
  Q.all([
    Mailer.List.loadById(req.params.listId),
    Mailer.Provider.loadById(req.params.providerId)
  ])
    .then(([mailerList, mailerProvider]) => {
      return mailerList.getSyncStatus(mailerProvider);
    })
    .then(
      r => res.json(r)
    )
    .catch(res.handleError());
};

exports.getSyncStatus = (req, res) => {
  Mailer.List.loadById(req.params.listId)
    .then(mailerList => {
      return mailerList.getSyncStatus();
    })
    .then(
      r => res.json(r)
    )
    .catch(res.handleError());
};
