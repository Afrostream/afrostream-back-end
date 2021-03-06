'use strict';

/**
 * @api {get} /api/episodes/:id Request Episode information
 * @apiName GetEpisode
 * @apiGroup Episode
 *
 * @apiParam {Number} id Episode unique ID.
 * @apiHeader Authorization Basic Access Authentication token.
 * @apiHeader Content-Type (application/x-www-form-urlencoded, application/json, application/xml).
 * @apiSuccess (Success 201) {text} Location URI of created Thing.
 * @apiSuccess (Success 201) {text} body Thing id.
 * @apiError {text} 401/Unauthorized.
 * @apiError {text} 403/Forbidden Required field [...] omitted.
 *
 * @apiSuccess {String} title Name of the Episode.
 * @apiSuccess {String} dateFrom Date start Episode.
 * @apiSuccess {String} dateTo Date end Episode.
 * @apiSuccess {String} type Type of the Episode (episode).
 * @apiSuccess {String} synopsis  Description of the Episode..
 * @apiSuccess {String} duration  Duration in seconds of the Episode..
 * @apiSuccess {String} slug  Slug url of the Episode..
 * @apiSuccess {String} active  Active in production.
 * @apiSuccess {String} seasonId Associated Season Id.
 * @apiSuccess {String} season Associated Season Object.
 * @apiSuccess {String} video Associated Video Object.
 * @apiSuccess {String} poster Poster Image Object.
 * @apiSuccess {String} thumb Thumb Image Object.
 * @apiExample {curl} Example usage:
 *    curl -i https://legacy-api.afrostream.tv/api/episodes/426
 * @apiSampleRequest https://legacy-api.afrostream.tv/api/episodes/426
 */

/**
 * @api {post} /api/episodes/search    Search episode
 * @apiName EpisodeSearch
 * @apiGroup Search
 *
 * @apiParam {String} query query string
 */

const express = require('express');
const controller = require('./episode.controller.js');
const auth = rootRequire('app/auth/auth.service');
const utils = rootRequire('app/api/utils.js');
const router = express.Router();

router.use(auth.middleware.restrictRoutesToAuthentified());

router.get('/', utils.middlewareNoCache, auth.hasRole('admin'), controller.index);
router.get('/:id', utils.middlewareCache, controller.show);
router.post('/', utils.middlewareNoCache, auth.hasRole('admin'), controller.create);
router.post('/search', utils.middlewareNoCache, controller.search);
router.post('/algolia', utils.middlewareNoCache, auth.hasRole('admin'), controller.algolia);
router.put('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.update);
router.patch('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.update);
router.delete('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.destroy);

module.exports = router;
