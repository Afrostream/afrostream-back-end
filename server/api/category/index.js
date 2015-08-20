'use strict';

var express = require('express');
var controller = require('./category.controller');
var auth = require('../../auth/auth.service');
var router = express.Router();

router.get('/', auth.isAuthenticated(), controller.index);
router.get('/menu', auth.isAuthenticated(), controller.menu);
router.get('/meas', controller.mea);
router.get('/:id', auth.isAuthenticated(), controller.show);
router.get('/:id/spots', auth.isAuthenticated(), controller.adSpot);
router.post('/', auth.hasRole('admin'), controller.create);
router.put('/:id', auth.hasRole('admin'), controller.update);
router.patch('/:id', auth.hasRole('admin'), controller.update);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);

module.exports = router;
