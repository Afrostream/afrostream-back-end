'use strict';

const express = require('express');
const controller = require('./catchup.controller');
const auth = rootRequire('app/auth/auth.service');
const utils = rootRequire('app/api/utils.js');
const router = express.Router();

router.post('/bet', utils.middlewareNoCache, controller.bet);
router.get('/bet/movies', utils.middlewareNoCache, auth.hasRole('admin'), controller.betMovies);
router.get('/bet/seasons', utils.middlewareNoCache, auth.hasRole('admin'), controller.betSeasons);
router.get('/bet/episodes', utils.middlewareNoCache, auth.hasRole('admin'), controller.betEpisodes);
router.get('/bet/videos', utils.middlewareNoCache, auth.hasRole('admin'), controller.betVideos);

module.exports = router;
