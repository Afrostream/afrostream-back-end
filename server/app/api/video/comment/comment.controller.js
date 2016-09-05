'use strict';

var _ = require('lodash');
var Q = require('q');

var sqldb = rootRequire('/server/sqldb');
var Video = sqldb.Video;
var User = sqldb.User;
var VideosComments = sqldb.VideosComments;

module.exports.index = function (req, res) {
  VideosComments.findAll({
      where: { videoId: req.params.videoId },
      include: [{
        model: User,
        as: 'user',
        required: true,
        attributes: ['nickname', 'facebook']
      }],
      order: [ ['createdAt', 'asc'] ]
    })
    .then(function (comments) {
      return (comments || []).map(function (comment) {
        return comment.get({plain: true});
      }).map(function (comment) {
        delete comment.user.profile;
        delete comment.user.token;
        return comment;
      });
    })
    .then(
      function (v) { res.json(v); },
      res.handleError()
    );
};

module.exports.create = function (req, res) {
  VideosComments.create({
    userId: req.user._id,
    videoId: req.params.videoId,
    timecode: req.body.timecode,
    text: req.body.text
  })
  .then(
    function (comment) { res.json(comment); },
    res.handleError()
  );
};

module.exports.update = function (req, res) {
  VideosComments.findById(req.params.commentId)
    .then(function (comment) {
      var error;

      if (!comment) {
        error = new Error('unknown comment');
        error.statusCode = 404;
        throw error;
      }
      if (comment.userId !== req.user._id) {
        error = new Error('cannot modify another user comment');
        error.statusCode = 403;
        throw error;
      }
      var updatedData = {};
      if (typeof req.body.timecode !== 'undefined') {
        updatedData.timecode = req.body.timecode;
      }
      if (typeof req.body.text !== 'undefined') {
        updatedData.text = req.body.text;
      }
      return comment.update(updatedData);
    })
    .then(
      function (comment) { res.json(comment); },
      res.handleError()
    );
};

module.exports.show = function (req, res) {
  VideosComments.findById(req.params.commentId)
    .then(function (comment) {
      if (!comment) {
        var error = new Error('unknown comment');
        error.statusCode = 404;
        throw error;
      }
      return comment;
    })
    .then(
      function (comment) { res.json(comment); },
      res.handleError()
    );
};

module.exports.delete = function (req, res) {
  VideosComments.findById(req.params.commentId)
    .then(function (comment) {
      if (!comment) {
        var error = new Error('unknown comment');
        error.statusCode = 404;
        throw error;
      }
      if (comment.userId !== req.user._id) {
        error = new Error('cannot delete another user comment');
        error.statusCode = 403;
        throw error;
      }
      return comment.destroy();
    })
    .then(
      function () { res.json({}); },
      res.handleError()
    );
};
