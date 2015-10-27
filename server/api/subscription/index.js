'use strict';

var express = require('express');
var controller = require('./subscription.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', auth.hasRole('admin'), controller.index);
router.get('/me', auth.isAuthenticated(), controller.me);
router.get('/billing', auth.isAuthenticated(), controller.billing);
router.get('/cancel', auth.isAuthenticated(), controller.cancel);
router.get('/invoice', auth.isAuthenticated(), controller.invoice);
router.get('/all', auth.isAuthenticated(), controller.all);
router.get('/status', auth.isAuthenticated(), controller.status);
router.get('/:id', auth.hasRole('admin'), controller.show);
router.post('/', auth.isAuthenticated(), controller.create);
router.post('/gifts', auth.isAuthenticated(), controller.gift);
router.put('/:id', auth.hasRole('admin'), controller.update);
router.patch('/:id', auth.hasRole('admin'), controller.update);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);

module.exports = router;
