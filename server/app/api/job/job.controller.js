'use strict';

var Q = require('q');

var utils = require('../utils.js');

var createJobPackCaptions = require('./job.packcaptions.js').create;

var createJobCatchupBet = require('./job.catchup-bet.js').create;

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

exports.catchupBet = function (req, res) {
  Q()
    .then(function validateBody() {
      if (req.body.sharedSecret !== '62b8557f248035275f6f8219fed7e9703d59509c')  throw 'unauthentified';
      if (!req.body.xml) throw 'xml missing';
      if (!req.body.mamId) throw 'mamId missing';
      if (req.body.captions && !Array.isArray(req.body.captions)) throw 'malformed captions';
    })
    .then(function () {
      return createJobCatchupBet({
        xml: req.body.xml,
        mamId: req.body.mamId,
        captions: req.body.captions || []
      });
    })
    .then(
      function success(result) { res.status(200).json(result); },
      function error(err) {
        console.error(err);
        res.status(500).send(err);
      });
};

exports.cacheUsersSubscriptions = function (req, res) {
  // connect to recurly
};