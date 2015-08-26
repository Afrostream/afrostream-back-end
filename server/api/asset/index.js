'use strict';

var express = require('express');
var controller = require('./asset.controller');
var auth = require('../../auth/auth.service');
var config = require('../../config/environment');
var router = express.Router();

router.get('/', auth.hasRole('admin'), controller.index);
router.get('/:id', auth.hasRole('admin'), controller.show);
if (config.digibos.useToken == true) {
  router.get('/:id/:token/*', auth.isAuthenticated(), controller.proxify);
}
router.post('/', auth.hasRole('admin'), controller.create);
router.put('/:id', auth.hasRole('admin'), controller.update);
router.patch('/:id', auth.hasRole('admin'), controller.update);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);

module.exports = router;
