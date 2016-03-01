'use strict';

/**
 * @api {get} /api/movies/:id Request Movie information
 * @apiName GetMovie
 * @apiGroup Movie
 *
 * @apiParam {Number} id Movie unique ID.
 * @apiHeader Authorization Basic Access Authentication token.
 * @apiHeader Content-Type (application/x-www-form-urlencoded, application/json, application/xml).
 * @apiSuccess (Success 201) {text} Location URI of created Thing.
 * @apiSuccess (Success 201) {text} body Thing id.
 * @apiError {text} 401/Unauthorized.
 * @apiError {text} 403/Forbidden Required field [...] omitted.
 *
 * @apiSuccess {String} title Name of the Movie.
 * @apiSuccess {String} dateFrom Date start Movie.
 * @apiSuccess {String} dateTo Date end Movie.
 * @apiSuccess {String} type Type of the Movie (season/movie).
 * @apiSuccess {String} synopsis  Description of the Movie..
 * @apiSuccess {String} duration  Duration in seconds of the Movie..
 * @apiSuccess {String} slug  Slug url of the Movie..
 * @apiSuccess {String} active  Active in production.
 * @apiSuccess {String} categorys Associated Categorys.
 * @apiSuccess {String} seasons Associated Seasons list.
 * @apiSuccess {String} poster Poster Image Object.
 * @apiSuccess {String} thumb Thumb Image Object.
 * @apiExample {curl} Example usage:
 *    curl -i https://legacy-api.afrostream.tv/api/movies/29
 * @apiSampleRequest https://legacy-api.afrostream.tv/api/movies/29
 */

/**
 * @api {post} /api/movies/search    Search movie
 * @apiName MovieSearch
 * @apiGroup Search
 *
 * @apiParam {String} query query string
 */

var express = require('express');
var controller = require('./movie.controller.js');
var auth = rootRequire('/server/auth/auth.service');

var router = express.Router();

router.get('/', auth.hasRole('admin'), controller.index);
router.get('/:id', controller.show);
router.get('/:movieId/seasons/first/episodes/first/video', controller.getFirstActiveVideo);
router.get('/:id/seasons', controller.seasons);
router.post('/', auth.hasRole('admin'), controller.create);
router.post('/search', controller.search);
router.post('/algolia', auth.hasRole('admin'), controller.algolia);
router.put('/:id', auth.hasRole('admin'), controller.update);
router.patch('/:id', auth.hasRole('admin'), controller.update);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);

module.exports = router;
