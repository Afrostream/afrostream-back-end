/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/clients              ->  index
 * POST    /api/clients              ->  create
 * GET     /api/clients/:id          ->  show
 * PUT     /api/clients/:id          ->  update
 * DELETE  /api/clients/:id          ->  destroy
 */

'use strict';

var sqldb = require('../../sqldb');
var Client = sqldb.Client;

var generic = require('../generic.js')
  , genericCreate = generic.create
  , genericIndex = generic.index
  , genericDestroy = generic.destroy
  , genericShow = generic.show
  , genericUpdate = generic.update;

// Gets a list of clients
exports.index = genericIndex({model: Client});

// Gets a single client from the DB
exports.show = genericShow({model: Client});

// Creates a new client in the DB
exports.create = genericCreate({model: Client});

// Updates an existing client in the DB
exports.update = genericUpdate({model: Client});

// Deletes a client from the DB
exports.destroy = genericDestroy({model: Client});
