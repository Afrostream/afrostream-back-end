const express = require('express');
const controller = require('./broadcaster.controller.js');
const router = express.Router();

// all video routes cannot be cached.
router.use((req, res, next) => {
  res.noCache();
  next();
});

router.get('/:broadcasterId/episodes', controller.episodes); // tous les épisodes auquel a accès un broadcaster
router.get('/:broadcasterId/movies', controller.movies);     // toutes les movies auxquelles a accès un broadcaster

module.exports = router;
