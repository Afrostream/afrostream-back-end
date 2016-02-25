'use strict';

var _ = require('lodash');
var auth = rootRequire('/server/auth/auth.service');
var sqldb = rootRequire('/server/sqldb');
var User = sqldb.User;
var UsersVideos = sqldb.UsersVideos;
var UsersFavoritesEpisodes = sqldb.UsersFavoritesEpisodes;

module.exports.update = function (req, res) {
  var userVideoKey = { userId: req.user._id, videoId: req.params.videoId};
  var data = _.merge({}, req.body, userVideoKey);
  UsersVideos.upsert(data, { where: userVideoKey })
    .then(
      function () { res.json({}); },
      function (err) { res.status(err.statusCode || 500).json({error: err.message || String(err)}); }
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
      function (err) { res.status(err.statusCode || 500).json({error: err.message || String(err)}); }
    );
};

module.exports.index = function (req, res) {
  UsersVideos.findAll({ where: { userId: req.user._id }, order: [ ['dateLastRead', 'desc'] ] })
    .then(
      function (e) { res.json(e || []); },
      function (err) { res.status(err.statusCode || 500).json({error: err.message || String(err)}); }
    );
};