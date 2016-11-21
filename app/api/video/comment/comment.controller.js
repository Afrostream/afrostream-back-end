'use strict';

var sqldb = rootRequire('sqldb');
var User = sqldb.User;
var VideosComments = sqldb.VideosComments;

module.exports.index = (req, res) => {
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
    .then(comments => // FIXME: USER_PRIVACY: we should implement a privacy filter in a single place
  (comments || []).map(comment => {
    var c = comment.get({plain: true});
    c.user = comment.user.getPublicInfos();
    return c;
  }))
    .then(
      v => { res.json(v); },
      res.handleError()
    );
};

module.exports.create = (req, res) => {
  VideosComments.create({
    userId: req.user._id,
    videoId: req.params.videoId,
    timecode: req.body.timecode,
    text: req.body.text
  })
  .then(
    comment => { res.json(comment); },
    res.handleError()
  );
};

module.exports.update = (req, res) => {
  VideosComments.findById(req.params.commentId)
    .then(comment => {
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
      comment => { res.json(comment); },
      res.handleError()
    );
};

module.exports.show = (req, res) => {
  VideosComments.findById(req.params.commentId)
    .then(comment => {
      if (!comment) {
        var error = new Error('unknown comment');
        error.statusCode = 404;
        throw error;
      }
      return comment;
    })
    .then(
      comment => { res.json(comment); },
      res.handleError()
    );
};

module.exports.delete = (req, res) => {
  VideosComments.findById(req.params.commentId)
    .then(comment => {
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
      () => { res.json({}); },
      res.handleError()
    );
};
