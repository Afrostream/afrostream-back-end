'use strict';

var auth = rootRequire('/server/auth/auth.service');
var sqldb = rootRequire('/server/sqldb');
var User = sqldb.User;
var UsersVideos = sqldb.UsersVideos;
var UsersFavoritesEpisodes = sqldb.UsersFavoritesEpisodes;

module.exports.update = function (req, res) {
  UsersVideos.upsert(req.body, { where: { userId: req.user._id, videoId: req.params.videoId }})
    .then(function (e) { res.json(e); },
    function (err) { res.status(err.statusCode || 500).json({error: String(err)})});
};

module.exports.show = function (req, res) {
  UsersVideos.find({ where: { userId: req.user._id, videoId: req.params.videoId }})
    .then(
    function (e) { res.json(e); },
    function (err) { res.status(err.statusCode || 500).json({error: String(err)})});
};