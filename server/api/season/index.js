'use strict';

var express = require('express');
var controller = require('./season.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', controller.index);
router.get('/:id', controller.show);
router.get('/:id/episodes', controller.getEpisodes);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.patch('/:id', auth.hasRole('admin'), controller.update);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);

module.exports = router;
