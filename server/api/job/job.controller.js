'use strict';

var Q = require('q');

var utils = require('../utils.js');

var createJobPackCaptions = require('./job.packcaptions.js').create;

// Creates a new video in the DB
exports.create = function (req, res) {
  return Q()
    .then(
      function () {
        switch (req.body.type) {
          case 'pack captions':
            if (!req.body.data || !req.body.data.videoId) {
              throw "missing videoId";
            }
            return createJobPackCaptions(req.body.data.videoId);
          default:
            throw 'unknown job type';
        }
      })
    .then(
      function success (result) { res.status(200).json(result); },
      function error(err) {
        console.error(err);
        res.status(500).send(err);
      });
};
