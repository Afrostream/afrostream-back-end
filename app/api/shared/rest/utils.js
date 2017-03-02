const assert = require('better-assert');

const express = require('express');

const genericController = require('./generic.controller');

const { middlewareNoCache, middlewareCache } = rootRequire('app/api/v1/rest/utils');

const middlewareAdminOnly = rootRequire('app/api/v2/auth/auth.service').middlewares.adminOnly;

module.exports.routerCRUD = options => {
  assert(options);
  assert(options.Model);

  const router = express.Router();
  router.get('/', middlewareNoCache, middlewareAdminOnly, genericController.index(options));
  router.get('/:id', middlewareCache, genericController.show(options));
  router.post('/', middlewareNoCache, middlewareAdminOnly, genericController.create(options));
  router.put('/:id', middlewareNoCache, middlewareAdminOnly, genericController.update(options));
  router.patch('/:id', middlewareNoCache, middlewareAdminOnly, genericController.update(options));
  router.delete('/:id', middlewareNoCache, middlewareAdminOnly, genericController.destroy(options));
  return router;
};
