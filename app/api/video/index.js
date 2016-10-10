'use strict';

/**
 * @api {get} /api/videos/ Request Video list
 * @api {get} /api/videos/:id Request Video information
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
 *    curl -i https://legacy-api.afrostream.tv/api/users/4711
 * @apiSampleRequest https://legacy-api.afrostream.tv/api/users/4711
 */

var express = require('express');
var controller = require('./video.controller.js');
var auth = rootRequire('/app/auth/auth.service');
var utils = rootRequire('/app/api/utils.js');
var router = express.Router();

// all video routes cannot be cached.
router.use(function (req, res, next) {
  res.noCache();
  next();
});

router.use(auth.middleware.restrictRoutesToAuthentified());

//
router.use('/:videoId/comments', require('./comment'));

// video manipulation.
router.get('/', utils.middlewareNoCache, auth.hasRole('admin'), controller.index);
router.get('/:id', controller.show);
router.post('/', utils.middlewareNoCache, auth.hasRole('admin'), controller.create);
router.put('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.update);
router.patch('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.update);
router.delete('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.destroy);

module.exports = router;