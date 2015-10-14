/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/comments              ->  index
 * POST    /api/comments              ->  create
 * GET     /api/comments/:id          ->  show
 * PUT     /api/comments/:id          ->  update
 * DELETE  /api/comments/:id          ->  destroy
 */

'use strict';

var sqldb = require('../../sqldb');
var Comment = sqldb.Comment;

var generic = require('../generic.js')
  , genericCreate = generic.create
  , genericIndex = generic.index
  , genericDestroy = generic.destroy
  , genericShow = generic.show
  , genericUpdate = generic.update;

// Gets a list of comments
exports.index = genericIndex({model: Comment});

// Gets a single comment from the DB
exports.show = genericShow({model: Comment});

// Creates a new comment in the DB
exports.create = genericCreate({model: Comment});

// Updates an existing comment in the DB
exports.update = genericUpdate({model: Comment});

// Deletes a comment from the DB
exports.destroy = genericDestroy({model: Comment});
