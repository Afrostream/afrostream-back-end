'use strict';

const express = require('express');
const controller = require('./wallnote.controller.js');
const auth = rootRequire('app/auth/auth.service');
const router = express.Router();

router.get('/', controller.index);
router.post('/:id/score', auth.middleware.restrictRoutesToAuthentified(), controller.score);
router.get('/:id', auth.middleware.restrictRoutesToAuthentified(), controller.show);
router.post('/', auth.middleware.restrictRoutesToAuthentified(), controller.create);
router.put('/:id', auth.middleware.restrictRoutesToAuthentified(), controller.update);
router.delete('/:id', auth.middleware.restrictRoutesToAuthentified(), controller.destroy);

module.exports = router;
