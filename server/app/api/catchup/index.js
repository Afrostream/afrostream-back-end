'use strict';

var express = require('express');
var controller = require('./catchup.controller');
var auth = rootRequire('/server/auth/auth.service');
var utils = rootRequire('/server/app/api/utils.js');
var router = express.Router();

router.post('/bet', utils.middlewareNoCache, controller.bet);
router.get('/bet/movies', utils.middlewareNoCache, auth.hasRole('admin'), controller.betMovies);
router.get('/bet/seasons', utils.middlewareNoCache, auth.hasRole('admin'), controller.betSeasons);
router.get('/bet/episodes', utils.middlewareNoCache, auth.hasRole('admin'), controller.betEpisodes);
router.get('/bet/videos', utils.middlewareNoCache, auth.hasRole('admin'), controller.betVideos);

module.exports = router;
