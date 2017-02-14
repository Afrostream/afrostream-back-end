'use strict';

const express = require('express');
const controller = require('./asset.controller.js');
const auth = rootRequire('app/auth/auth.service');
const config = rootRequire('config');
const utils = rootRequire('app/api/utils.js');
const router = express.Router();

router.get('/', utils.middlewareNoCache, auth.hasRole('admin'), controller.index);
router.get('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.show);
if (config.mam.useToken == 'true') {
  router.get('/:id/:token/*', utils.middlewareNoCache, controller.proxify);
}
router.post('/', utils.middlewareNoCache, auth.hasRole('admin'), controller.create);
router.put('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.update);
router.patch('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.update);
router.delete('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.destroy);

module.exports = router;
