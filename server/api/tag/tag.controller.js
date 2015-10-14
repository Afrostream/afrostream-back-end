/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/tags              ->  index
 * POST    /api/tags              ->  create
 * GET     /api/tags/:id          ->  show
 * PUT     /api/tags/:id          ->  update
 * DELETE  /api/tags/:id          ->  destroy
 */

'use strict';

var sqldb = require('../../sqldb');
var Tag = sqldb.Tag;

var generic = require('../generic.js')
  , genericCreate = generic.create
  , genericIndex = generic.index
  , genericDestroy = generic.destroy
  , genericShow = generic.show
  , genericUpdate = generic.update;

// Gets a list of tags
exports.index = genericIndex({model: Tag});

// Gets a single tag from the DB
exports.show = genericShow({model: Tag});

// Creates a new tag in the DB
exports.create = genericCreate({model: Tag});

// Updates an existing tag in the DB
exports.update = genericUpdate({model: Tag});

// Deletes a tag from the DB
exports.destroy = genericDestroy({model: Tag});
