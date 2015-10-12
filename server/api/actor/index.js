'use strict';

/**
 * @api {get} /actors/    Request Actor list
 * @api {get} /actors/:id Request Actor information
 * @apiName GetActor
 * @apiGroup Actor
 *
 * @apiParam   {Number} id Actor unique ID.
 * @apiHeader  Authorization Basic Access Authentication token.
 * @apiHeader  Content-Type (application/x-www-form-urlencoded, application/json, application/xml).
 * @apiSuccess (Success 201) {text} Location URI of created Thing.
 * @apiSuccess (Success 201) {text} body Thing id.
 * @apiError   {text} 401/Unauthorized.
 * @apiError   {text} 403/Forbidden Required field [...] omitted.
 *
 * @apiSuccess {String} name Name of the Actor.
 * @apiSuccess {String} info  Info of the Actor.
 * @apiSuccess {String} assetId  AssetId Related.
 * @apiSuccess {String} captionId  CaptionId Related.
 * @apiSuccess {String} active  Active in production.
 * @apiExample {curl} Example usage:
 *    curl -i http://backend.afrostream.tv/api/users/4711
 * @apiSampleRequest http://backend.afrostream.tv/api/users/4711
 */


var express = require('express');
var controller = require('./actor.controller');
var auth = require('../../auth/auth.service');
var router = express.Router();

router.get('/', auth.hasRole('admin'), controller.index);
router.get('/:id', auth.isAuthenticated(), controller.show);
router.post('/', auth.hasRole('admin'), controller.create);
router.put('/:id', auth.hasRole('admin'), controller.update);
router.patch('/:id', auth.hasRole('admin'), controller.update);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);

module.exports = router;