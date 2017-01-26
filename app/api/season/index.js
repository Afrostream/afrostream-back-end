'use strict';

/**
 * @api {get} /api/seasons/:id Request Season information
 * @apiName GetSeason
 * @apiGroup Season
 *
 * @apiParam {Number} id Season unique ID.
 * @apiHeader Authorization Basic Access Authentication token.
 * @apiHeader Content-Type (application/x-www-form-urlencoded, application/json, application/xml).
 * @apiSuccess (Success 201) {text} Location URI of created Thing.
 * @apiSuccess (Success 201) {text} body Thing id.
 * @apiError {text} 401/Unauthorized.
 * @apiError {text} 403/Forbidden Required field [...] omitted.
 *
 * @apiSuccess {String} title Name of the Season.
 * @apiSuccess {String} dateFrom Date start Season.
 * @apiSuccess {String} dateTo  Date end Season.
 * @apiSuccess {String} synopsis  Description of the Season..
 * @apiSuccess {String} active  Active in production.
 * @apiSuccess {String} movie Associated Movie.
 * @apiSuccess {String} episodes Associated Episodes list.
 * @apiSuccess {String} poster Poster Image Object.
 * @apiSuccess {String} thumb Thumb Image Object.
 * @apiExample {curl} Example usage:
 *    curl -i https://legacy-api.afrostream.tv/api/seasons/29
 * @apiSampleRequest https://legacy-api.afrostream.tv/api/seasons/29
 */

/**
 * @api {post} /api/seasons/search    Search season
 * @apiName SeasonSearch
 * @apiGroup Search
 *
 * @apiParam {String} query query string
 */

const express = require('express');
const controller = require('./season.controller.js');
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
