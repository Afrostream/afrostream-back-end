'use strict';

var _ = require('lodash');
var Q = require('q');
var auth = rootRequire('/auth/auth.service');
var sqldb = rootRequire('/sqldb');
var User = sqldb.User;
var UsersVideos = sqldb.UsersVideos;
var UsersFavoritesEpisodes = sqldb.UsersFavoritesEpisodes;

module.exports.update = function (req, res) {
  var userVideoKey = { userId: req.user._id, videoId: req.params.videoId};
  var data = _.merge({}, req.body, userVideoKey);

  delete data.dateStartRead; // shouldn't overwrite model own dateStartRead.
  delete data.dateLastRead;  // should be automaticaly set (model update hook)
  data.lastUpdateClientType = req.passport && req.passport.client && req.passport.client.type || 'unknown';
  data.lastUpdateUserUA = String(req.userAgent || 'unknown').substr(0, 128);
  data.lastUpdateDeviceType = String(req.get('X-Device-Type') || '').substr(0, 16); // tapptic additionnal info.

  Q()
    .then(function () {
      // some security
      if (typeof data.rating !== 'undefined' && (data.rating < 1 || data.rating > 5)) {
        throw new Error('rating must be between 1 and 5 (inclusive)');
      }
      if (typeof data.playerPosition !== 'undefined' && data.playerPosition < 0) {
        throw new Error('playerPosition should be postive');
      }
      if (typeof data.playerAudio !== 'undefined' && typeof data.playerAudio !== 'string' && data.playerAudio !== null) {
        throw new Error('playerAudio must be a string');
      }
      if (typeof data.playerCaption !== 'undefined' && typeof data.playerCaption !== 'string' && data.playerCaption !== null) {
        throw new Error('playerCaption must be a string');
      }
      if (typeof data.playerAudio === 'string' && data.playerAudio.length !== 3) {
        throw new Error('playerAudio format should be ISO6392T');
      }
      // temp fix: translating the data.
      var translationTable = { 'fr': 'fra', 'en': 'eng' };
      if (data.playerCaption && typeof translationTable[data.playerCaption] !== 'undefined') {
        console.log('[WARNING]: [API]: ' + req.originalUrl + ' playerCaption was translated from '+data.playerCaption+ ' to ' + translationTable[data.playerCaption]);
        data.playerCaption = translationTable[data.playerCaption];
      }
      if (typeof data.playerCaption === 'string' && data.playerCaption.length !== 3) {
        throw new Error('playerCaption format should be ISO6392T');
      }
    })
    .then(function () {
      return UsersVideos.findOne({where: userVideoKey});
    })
    .then(function upsert(userVideo) {
      // manual upsert, non atomic, but avoid heroku posgres log
      // 2016-03-29T10:28:27Z app[postgres.24289]: [DATABASE] statement: CREATE OR REPLACE FUNCTION pg_temp.sequelize_upsert()...
      if (!userVideo) {
        return UsersVideos.create(data);
      } else {
        return userVideo.update(data);
      }
    })
    .then(
      function () { res.json({}); },
      res.handleError()
    );
};

module.exports.show = function (req, res) {
  var userVideoKey = { userId: req.user._id, videoId: req.params.videoId};
  UsersVideos.find({ where: userVideoKey})
    .then(
      function (userVideo) {
        if (!userVideo) {
          var error = new Error('not found');
          error.statusCode = 404;
          throw error;
        }
        return userVideo;
      }
    )
    .then(
      function (userVideo) { res.json(userVideo); },
      res.handleError()
    );
};

module.exports.index = function (req, res) {
  UsersVideos.findAll({ where: { userId: req.user._id }, order: [ ['dateLastRead', 'desc'] ] })
    .then(
      function (e) { res.json(e || []); },
      res.handleError()
    );
};
