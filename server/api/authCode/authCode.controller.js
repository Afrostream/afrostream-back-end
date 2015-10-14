/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/authCodes              ->  index
 * POST    /api/authCodes              ->  create
 * GET     /api/authCodes/:id          ->  show
 * PUT     /api/authCodes/:id          ->  update
 * DELETE  /api/authCodes/:id          ->  destroy
 */

'use strict';

var sqldb = require('../../sqldb');
var AuthCode = sqldb.AuthCode;

var generic = require('../generic.js')
  , genericCreate = generic.create
  , genericIndex = generic.index
  , genericDestroy = generic.destroy
  , genericShow = generic.show
  , genericUpdate = generic.update;

// Gets a list of authCodes
exports.index = genericIndex({model: AuthCode});

// Gets a single authCode from the DB
exports.show = genericShow({model: AuthCode});

// Creates a new authCode in the DB
exports.create = genericCreate({model: AuthCode});

// Updates an existing authCode in the DB
exports.update = genericUpdate({model: AuthCode});

// Deletes a authCode from the DB
exports.destroy = genericDestroy({model: AuthCode});
