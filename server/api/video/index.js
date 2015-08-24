'use strict';

/**
 * @api {get} /videos/ Request Video list
 * @api {get} /videos/:id Request Video information
 * @apiName GetVideo
 * @apiGroup Video
 *
 * @apiParam {Number} id Video unique ID.
 * @apiHeader Authorization Basic Access Authentication token.
 * @apiHeader Content-Type (application/x-www-form-urlencoded, application/json, application/xml).
 * @apiSuccess (Success 201) {text} Location URI of created Thing.
 * @apiSuccess (Success 201) {text} body Thing id.
 * @apiError {text} 401/Unauthorized.
 * @apiError {text} 403/Forbidden Required field [...] omitted.
 *
 * @apiSuccess {String} name Name of the Video.
 * @apiSuccess {String} info  Info of the Video.
 * @apiSuccess {String} assetId  AssetId Related.
 * @apiSuccess {String} captionId  CaptionId Related.
 * @apiSuccess {String} active  Active in production.
 * @apiExample {curl} Example usage:
 *    curl -i https://afrostream-backend.herokuapp.com/api/users/4711
 * @apiSampleRequest https://afrostream-backend.herokuapp.com/api/users/4711
 */

var express = require('express');
var controller = require('./video.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', auth.hasRole('admin'), controller.index);
router.get('/:id', auth.hasRole('admin'), controller.show);
router.get('/:id/token', auth.isAuthenticated(), controller.showToken);
router.post('/', auth.hasRole('admin'), controller.create);
router.put('/:id', auth.hasRole('admin'), controller.update);
router.patch('/:id', auth.hasRole('admin'), controller.update);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);

module.exports = router;
