'use strict';

/**
 * @api {get} /api/actors/    Request Actor list
 * @api {get} /api/actors/:id Request Actor information
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
 */


const express = require('express');
const controller = require('./actor.controller.js');
const auth = rootRequire('app/auth/auth.service');
const utils = rootRequire('app/api/utils.js');
const router = express.Router();

router.use(auth.middleware.restrictRoutesToAuthentified());

router.get('/', utils.middlewareNoCache, auth.hasRole('admin'), controller.index);
router.get('/:id', utils.middlewareCache, controller.show);
router.post('/', utils.middlewareNoCache, auth.hasRole('admin'), controller.create);
router.put('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.update);
router.patch('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.update);
router.delete('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.destroy);

module.exports = router;
