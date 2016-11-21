'use strict';

const sqldb = rootRequire('sqldb');
const WallNote = sqldb.WallNote;
const WallNotesUsers = sqldb.WallNotesUsers;
const User = sqldb.User;

const Q = require('q');

exports.index = (req, res) => {
  const limit = req.query.limit || 20;
  const offset = req.query.offset || 0;

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
    o => { res.json(o || []); },
    res.handleError()
  );
};

exports.show = (req, res) => {
  WallNote.find({
    where: {
      _id: req.params.id
    }
  })
  .then(wallNote => {
    if (!wallNote) {
      const error = new Error('not found');
      error.statusCode = 404;
      throw error;
    }
  })
  .then(
    wallNote => { res.json(wallNote); },
    res.handleError()
  );
};

exports.create = (req, res) => {
  Q()
    .then(() => {
      if (!req.body.type) {
        throw new Error('missing type');
      }
      if (!req.body.content) {
        throw new Error('missing content');
      }
    })
    .then(() => WallNote.create({
    userId: req.user._id,
    active: true,
    type: req.body.type,
    content: req.body.content
  }))
    .then(
      wallNote => { res.json(wallNote); },
      res.handleError()
    );
};

exports.update = (req, res) => {
  WallNote.find({
    where: {
      _id: req.params.id
    }
  })
  .then(wallNote => {
    if (!req.body.type) {
      throw new Error('missing type');
    }
    if (!req.body.content) {
      throw new Error('missing content');
    }
    if (!wallNote) {
      const error = new Error('not found');
      error.statusCode = 404;
      throw error;
    }
    if (wallNote.userId !== req.user._id) {
      const error = new Error('cannot modify another user note');
      error.statusCode = 403;
      throw error;
    }
    return wallNote;
  })
  .then(wallNote => wallNote.update({
    type: req.body.type,
    content: req.body.content,
    updatedAt: new Date()
  }))
  .then(
    wallNote => { res.json(wallNote); },
    res.handleError()
  );
};

exports.score = (req, res) => {
  Q()
    .then(() => {
      if (typeof req.body.score === 'undefined') {
        throw new Error('missing score');
      }
      if (parseInt(req.body.score, 10) !== 0 &&
          parseInt(req.body.score, 10) !== 1 &&
          parseInt(req.body.score, 10) !== -1) {
        throw new Error('score should be 0, 1 or -1');
      }
    })
    .then(() => WallNotesUsers.find({
    where: {userId: req.user._id, wallNoteId: req.params.id}
  })).then(wallNotesUsers => {
      if (!wallNotesUsers) {
        // not found => create
        return WallNotesUsers.create({
          userId: req.user._id,
          wallNoteId: req.params.id,
          score: 0
        });
      } else {
        // update
        return wallNotesUsers.update({
          score: parseInt(req.body.score, 10)
        });
      }
    }).then(() => // on recherche le score
  WallNotesUsers.sum('score', {
    where: { wallNoteId: req.params.id }
  })).then(score => WallNote.findOne({where: {_id: req.params.id }})
    .then(wallNote => {
      if (!wallNote) {
        throw new Error('must have a wallnote corresponding');
      }
      return wallNote.save({
        score: score,
        updatedAt: new Date() // une modif du score remonte le contenu
      });
    })).then(
      wallNote => { res.json(wallNote); },
      res.handleError()
    );
};

// Deletes a client from the DB
exports.destroy = (req, res) => {
  WallNote.find({
    where: {
      _id: req.params.id
    }
  })
  .then(wallNote => {
    if (!wallNote) {
      const error = new Error('not found');
      error.statusCode = 404;
      throw error;
    }
    if (wallNote.userId !== req.user._id) {
      const error = new Error('cannot modify another user note');
      error.statusCode = 403;
      throw error;
    }
    return wallNote;
  })
  .then(wallNote => wallNote.destroy())
  .then(
    () => { res.json({}); },
    res.handleError()
  );
};
