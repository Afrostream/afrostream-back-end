const assert = require('better-assert');

const _ = require('lodash');

const express = require('express');

const genericController = require('./generic.controller');
const auth = rootRequire('app/api/v1/auth/auth.service');

const { middlewareNoCache, middlewareCache } = rootRequire('app/api/v1/rest/utils');

module.exports.rewriteQuery = query => {
  const defaultLimit = 100; // fixme: config

  return _.merge(query, {
    limit: query.limit || defaultLimit,
    offset: query.offset || 0,
    populate: (query.populate || '').split(',')
  });
};

module.exports.routerCRUD = options => {
  assert(options);
  assert(options.model);

  const router = express.Router();
  router.get('/', middlewareNoCache, auth.hasRole('admin'), genericController.index(options));
  router.get('/:id', middlewareCache, genericController.show(options));
  router.post('/', middlewareNoCache, auth.hasRole('admin'), genericController.create(options));
  router.put('/:id', middlewareNoCache, auth.hasRole('admin'), genericController.update(options));
  router.patch('/:id', middlewareNoCache, auth.hasRole('admin'), genericController.update(options));
  router.delete('/:id', middlewareNoCache, auth.hasRole('admin'), genericController.destroy(options));
  return router;
};
