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

const express = require('express');
const controller = require('./video.controller.js');
const auth = rootRequire('app/auth/auth.service');
const utils = rootRequire('app/api/utils.js');
const router = express.Router();
const middlewareStatsd = rootRequire('statsd').middleware;

// all video routes cannot be cached.
router.use((req, res, next) => {
  res.noCache();
  next();
});

router.use(auth.middleware.restrictRoutesToAuthentified());

//
router.use('/:videoId/comments', require('./comment'));

// import
router.get('/importFromPfContent', utils.middlewareNoCache, auth.hasRole('admin'), controller.importFromPfContent);

// video manipulation.
router.get('/', utils.middlewareNoCache, auth.hasRole('admin'), controller.index);
router.get('/:id', middlewareStatsd({route: 'api.video'}), controller.show);
router.post('/', utils.middlewareNoCache, auth.hasRole('admin'), controller.create);
router.put('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.update);
router.patch('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.update);
router.delete('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.destroy);

module.exports = router;
