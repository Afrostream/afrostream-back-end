/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/refreshTokens              ->  index
 * POST    /api/refreshTokens              ->  create
 * GET     /api/refreshTokens/:id          ->  show
 * PUT     /api/refreshTokens/:id          ->  update
 * DELETE  /api/refreshTokens/:id          ->  destroy
 */

'use strict';

var sqldb = require('../../sqldb');
var RefreshToken = sqldb.RefreshToken;

var generic = require('../generic.js')
  , genericCreate = generic.create
  , genericIndex = generic.index
  , genericDestroy = generic.destroy
  , genericShow = generic.show
  , genericUpdate = generic.update;

// Gets a list of refreshTokens
exports.index = genericIndex({model: RefreshToken});

// Gets a single refreshToken from the DB
exports.show = genericShow({model: RefreshToken});

// Creates a new refreshToken in the DB
exports.create = genericCreate({model: RefreshToken});

// Updates an existing refreshToken in the DB
exports.update = genericUpdate({model: RefreshToken});

// Deletes a refreshToken from the DB
exports.destroy = genericDestroy({model: RefreshToken});
