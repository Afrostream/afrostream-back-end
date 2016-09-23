'use strict';

var express = require('express');
var controller = require('./wallnote.controller.js');
var auth = rootRequire('/server/auth/auth.service');
var router = express.Router();

router.get('/', controller.index);
router.post('/:id/score', auth.middleware.restrictRoutesToAuthentified(), controller.score);
router.get('/:id', auth.middleware.restrictRoutesToAuthentified(), controller.show);
router.post('/', auth.middleware.restrictRoutesToAuthentified(), controller.create);
router.put('/:id', auth.middleware.restrictRoutesToAuthentified(), controller.update);
router.delete('/:id', auth.middleware.restrictRoutesToAuthentified(), controller.destroy);

module.exports = router;
