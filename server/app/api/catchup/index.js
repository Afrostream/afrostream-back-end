'use strict';

var express = require('express');
var controller = require('./catchup.controller');
var auth = rootRequire('/server/auth/auth.service');

var router = express.Router();

router.post('/bet', controller.bet);

router.get('/bet/movies', auth.hasRole('admin'), controller.betMovies);
router.get('/bet/seasons', auth.hasRole('admin'), controller.betSeasons);
router.get('/bet/episodes', auth.hasRole('admin'), controller.betEpisodes);
router.get('/bet/videos', auth.hasRole('admin'), controller.betVideos);

module.exports = router;
