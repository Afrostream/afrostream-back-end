/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/languages              ->  index
 * POST    /api/languages              ->  create
 * GET     /api/languages/:id          ->  show
 * PUT     /api/languages/:id          ->  update
 * DELETE  /api/languages/:id          ->  destroy
 */

'use strict';

var sqldb = require('../../sqldb');
var Language = sqldb.Language;

var generic = require('../generic.js')
  , genericCreate = generic.create
  , genericIndex = generic.index
  , genericDestroy = generic.destroy
  , genericShow = generic.show
  , genericUpdate = generic.update;

// Gets a list of languages
exports.index = genericIndex({model: Language});

// Gets a single language from the DB
exports.show = genericShow({model: Language});

// Creates a new language in the DB
exports.create = genericCreate({model: Language});

// Updates an existing language in the DB
exports.update = genericUpdate({model: Language});

// Deletes a language from the DB
exports.destroy = genericDestroy({model: Language});