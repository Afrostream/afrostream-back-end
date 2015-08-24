'use strict';

var express = require('express');
var controller = require('./asset.controller');
var auth = require('../../auth/auth.service');
var router = express.Router();

router.get('/', auth.hasRole('admin'), controller.index);
router.get('/:token/:id', auth.isAuthenticated(), controller.showToken);
router.post('/:id', auth.hasRole('admin'), controller.show);
router.post('/', auth.hasRole('admin'), controller.create);
router.put('/:id', auth.hasRole('admin'), controller.update);
router.patch('/:id', auth.hasRole('admin'), controller.update);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);

module.exports = router;
