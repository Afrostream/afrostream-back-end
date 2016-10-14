var express = require('express');
var controller = require('./broadcaster.controller.js');
var auth = rootRequire('/app/auth/auth.service');
var utils = rootRequire('/app/api/utils.js');
var router = express.Router();

// all video routes cannot be cached.
router.use(function (req, res, next) {
  res.noCache();
  next();
});

router.get('/:broadcasterId/episodes', controller.episodes); // tous les épisodes auquel a accès un broadcaster
router.get('/:broadcasterId/movies', controller.movies);     // toutes les movies auxquelles a accès un broadcaster

module.exports = router;
