'use strict';

var express = require('express');
var controller = require('./asset.controller.js');
var auth = rootRequire('/server/auth/auth.service');
var config = rootRequire('/server/config');
var utils = rootRequire('/server/app/api/utils.js');
var router = express.Router();

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
