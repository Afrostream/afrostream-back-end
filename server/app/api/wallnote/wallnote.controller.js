'use strict';

var _ = require('lodash');
var sqldb = rootRequire('/server/sqldb');
var WallNote = sqldb.WallNote;
var WallNotesUsers = sqldb.WallNotesUsers;

var Q = require('q');

var utils = rootRequire('/server/app/api/utils.js');

exports.index = function(req, res) {
  var limit = req.query.limit || 20;
  var offset = req.query.offset || 0;

  WallNote.findAll({
    order: [['updatedAt', 'DESC']],
    include: [{
      model: User,
      as: 'user',
      required: true,
      attributes: ['nickname']
    }],
    limit: limit,
    offset: offset
  })
  .then(
    function (o) { res.json(o || []); },
    res.handleError()
  );
};

exports.show = function(req, res) {
  WallNote.find({
    where: {
      _id: req.params.id
    }
  })
  .then(function (wallNote) {
    if (!wallNote) {
      var error = new Error('not found');
      error.statusCode = 404;
      throw error;
    }
  })
  .then(
    function (wallNote) { res.json(wallNote); },
    res.handleError()
  );
};

exports.create = function(req, res) {
  Q()
    .then(function () {
      if (!req.body.type) {
        throw new Error('missing type');
      }
      if (!req.body.content) {
        throw new Error('missing content');
      }
    })
    .then(function () {
      return WallNote.create({
        userId: req.user._id,
        active: true,
        type: req.body.type,
        content: req.body.content
      })
    })
    .then(
      function (wallNote) { res.json(wallNote); },
      res.handleError()
    );
};

exports.update = function(req, res) {
  WallNote.find({
    where: {
      _id: req.params.id
    }
  })
  .then(function (wallNote) {
    if (!req.body.type) {
      throw new Error('missing type');
    }
    if (!req.body.content) {
      throw new Error('missing content');
    }
    if (!wallNote) {
      var error = new Error('not found');
      error.statusCode = 404;
      throw error;
    }
    if (wallNote.userId !== req.user._id) {
      var error = new Error('cannot modify another user note');
      error.statusCode = 403;
      throw error;
    }
    return wallNote;
  })
  .then(function (wallNote) {
    return wallNote.update({
      type: req.body.type,
      content: req.body.content,
      updatedAt: new Date()
    });
  })
  .then(
    function (wallNote) { res.json(wallNote); },
    res.handleError()
  );
};

exports.score = function (req, res) {
  Q()
    .then(function () {
      var error;

      if (typeof req.body.score === 'undefined') {
        throw new Error('missing score');
      }
      if (parseInt(req.body.score, 10) !== 0 &&
          parseInt(req.body.score, 10) !== 1 &&
          parseInt(req.body.score, 10) !== -1) {
        throw new Error('score should be 0, 1 or -1');
      }
    })
    .then(function () {
      return WallNotesUsers.find({
        where: {userId: req.user._id, wallNoteId: req.params.id}
      });
    }).then(function (wallNotesUsers) {
      if (!wallNotesUsers) {
        // not found => create
        return WallNotesUsers.create({
          userId: req.user._id,
          wallNoteId: req.params.id,
          score: 0
        })
      } else {
        // update
        return wallNotesUsers.update({
          score: parseInt(req.body.score, 10)
        });
      }
    }).then(function () {
      // on recherche le score
      return WallNotesUsers.sum('score', {
        where: { wallNoteId: req.params.id }
      });
    }).then(function (score) {
      return WallNote.findOne({where: {_id: req.params.id }})
        .then(function (wallNote) {
          if (!wallNote) {
            throw new Error('must have a wallnote corresponding');
          }
          return wallNote.save({
            score: score,
            updatedAt: new Date() // une modif du score remonte le contenu
          });
        });
    }).then(
      function (wallNote) { res.json(wallNote); },
      res.handleError()
    );
};

// Deletes a client from the DB
exports.destroy = function(req, res) {
  WallNote.find({
    where: {
      _id: req.params.id
    }
  })
  .then(function (wallNote) {
    if (!wallNote) {
      var error = new Error('not found');
      error.statusCode = 404;
      throw error;
    }
    if (wallNote.userId !== req.user._id) {
      var error = new Error('cannot modify another user note');
      error.statusCode = 403;
      throw error;
    }
    return wallNote;
  })
  .then(function (wallNote) {
    return wallNote.destroy();
  })
  .then(
    function () { res.json({}); },
    res.handleError()
  );
};
