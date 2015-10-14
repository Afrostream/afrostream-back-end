/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/accessTokens              ->  index
 * POST    /api/accessTokens              ->  create
 * GET     /api/accessTokens/:id          ->  show
 * PUT     /api/accessTokens/:id          ->  update
 * DELETE  /api/accessTokens/:id          ->  destroy
 */

'use strict';

var sqldb = require('../../sqldb');
var AccessToken = sqldb.AccessToken;

var generic = require('../generic.js')
  , genericCreate = generic.create
  , genericIndex = generic.index
  , genericDestroy = generic.destroy
  , genericShow = generic.show
  , genericUpdate = generic.update;

// Gets a list of accessTokens
exports.index = genericIndex({model: AccessToken});

// Gets a single accessToken from the DB
exports.show = genericShow({model: AccessToken});

// Creates a new accessToken in the DB
exports.create = genericCreate({model: AccessToken});

// Updates an existing accessToken in the DB
exports.update = genericUpdate({model: AccessToken});

// Deletes a accessToken from the DB
exports.destroy = genericDestroy({model: AccessToken});
