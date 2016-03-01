'use strict';

var express = require('express');
var controller = require('./asset.controller.js');
var auth = rootRequire('/server/auth/auth.service');
var config = rootRequire('/server/config');
var router = express.Router();

router.get('/', auth.hasRole('admin'), controller.index);
router.get('/:id', auth.hasRole('admin'), controller.show);
if (config.mam.useToken == 'true') {
  router.get('/:id/:token/*', controller.proxify);
}
router.post('/', auth.hasRole('admin'), controller.create);
router.put('/:id', auth.hasRole('admin'), controller.update);
router.patch('/:id', auth.hasRole('admin'), controller.update);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);

module.exports = router;
