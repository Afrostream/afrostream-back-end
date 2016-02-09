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

var express = require('express');
var controller = require('./season.controller.js');
var auth = rootRequire('/server/auth/auth.service');

var router = express.Router();

router.get('/', auth.hasRole('admin'), controller.index);
router.get('/:id', auth.isAuthenticated(), controller.show);
router.post('/', auth.hasRole('admin'), controller.create);
router.post('/search', auth.isAuthenticated(), controller.search);
router.post('/algolia', auth.hasRole('admin'), controller.algolia);
router.put('/:id', auth.hasRole('admin'), controller.update);
router.patch('/:id', auth.hasRole('admin'), controller.update);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);

module.exports = router;
