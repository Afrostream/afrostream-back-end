'use strict';

/**
 * @api {get} /api/categorys/ Request Category list
 * @apiParam (queryString) {String} populate object associations
 * @apiParamExample {json} populate
 *  ?populate=movies
 *  ?populate=adSpots
 *  ?populate=movies,adSpots (default)
 *  ?populate=movies.poster,movies.thumb,adSpots
 *
 *  list of associations:
 *    movies,movies.categorys,movies.logo,movies.poster,movies.thumb,
 *    adSpots,adSpots.categorys,adSpots.logo,adSpots.poster,adSpots.thumb
 * @apiParam (queryString) {String} limit limit the number of categories returned, 0 = unlimited, default=unlimited
 * @apiParam (queryString) {String} limitMovies limit the number of movies in categories.movies returned, 0 = unlimited, default=unlimited
 * @apiParam (queryString) {String} limitAdSpots limit the number of movies categories.adSpots returned, 0 = unlimited, default=unlimited
 *
 * @apiName GetAllCategorys
 * @apiGroup Category
 *
 * @apiSuccessExample (200) {json} Success-Response:
 * [
 *    {
 *       id: ...
 *       (...)
 *    },
 *    (...)
 * ]
 * @apiError {text} 401/Unauthorized.
 * @apiError {text} 403/Forbidden Required field [...] omitted.
 */

/**
 * @api {get} /api/categorys/:id Request Category information
 * @apiName GetCategory
 * @apiGroup Category
 *
 * @apiParam {Number} id Category unique ID.
 * @apiHeader Authorization Basic Access Authentication token.
 * @apiHeader Content-Type (application/x-www-form-urlencoded, application/json, application/xml).
 * @apiSuccess (Success 201) {text} Location URI of created Thing.
 * @apiSuccess (Success 201) {text} body Thing id.
 * @apiError {text} 401/Unauthorized.
 * @apiError {text} 403/Forbidden Required field [...] omitted.
 *
 * @apiSuccess {String} label Name of the Category.
 * @apiSuccess {String} slug Slug url of the Category.
 * @apiSuccess {String} active  Active in production.
 * @apiSuccess {String} seasonId Associated Season Id.
 * @apiSuccess {String} season Associated Season Object.
 * @apiSuccess {String} movies Associated Movies Object.
 * @apiSuccess {String} adSpots Associated AdSpots Object.
 * @apiExample {curl} Example usage:
 *    curl -i https://legacy-api.afrostream.tv/api/categorys/3
 * @apiSampleRequest https://legacy-api.afrostream.tv/api/categorys/3
 */

/**
 * @api {get} /api/categorys/menu Request Menu Home information
 * @apiName GetCategoryMenu
 * @apiGroup Menu
 *
 * @apiHeader Authorization Basic Access Authentication token.
 * @apiHeader Content-Type (application/x-www-form-urlencoded, application/json, application/xml).
 * @apiSuccess (Success 201) {text} Location URI of created Thing.
 * @apiSuccess (Success 201) {text} body Thing id.
 * @apiError {text} 401/Unauthorized.
 * @apiError {text} 403/Forbidden Required field [...] omitted.
 *
 * @apiSuccess {Array} Category list.
 * @apiSuccess {String} active  Active in production.
 * @apiSuccess {String} seasonId Associated Season Id.
 * @apiSuccess {String} season Associated Season Object.
 * @apiSuccess {String} movies Associated Movies Object.
 * @apiSuccess {String} adSpots Associated AdSpots Object.
 * @apiExample {curl} Example usage:
 *    curl -i https://legacy-api.afrostream.tv/api/categorys/3
 * @apiSampleRequest https://legacy-api.afrostream.tv/api/categorys/3
 */

/**
 * @api {get} /api/categorys/menu Request Menu Home information
 * @apiName GetCategoryMenu
 * @apiGroup Menu
 *
 * @apiHeader Authorization Basic Access Authentication token.
 * @apiHeader Content-Type (application/x-www-form-urlencoded, application/json, application/xml).
 * @apiSuccess (Success 201) {text} Location URI of created Thing.
 * @apiSuccess (Success 201) {text} body Thing id.
 * @apiError {text} 401/Unauthorized.
 * @apiError {text} 403/Forbidden Required field [...] omitted.
 *
 * @apiSuccess {Array} Category list.
 * @apiExample {curl} Example usage:
 *    curl -i https://legacy-api.afrostream.tv/api/categorys/menu
 * @apiSampleRequest https://legacy-api.afrostream.tv/api/categorys/menu
 */

/**
 * @api {get} /api/categorys/mea Request All mea for HomePage
 * @apiName GetMea
 * @apiGroup Mea
 *
 * @apiHeader Authorization Basic Access Authentication token.
 * @apiHeader Content-Type (application/x-www-form-urlencoded, application/json, application/xml).
 * @apiSuccess (Success 201) {text} Location URI of created Thing.
 * @apiSuccess (Success 201) {text} body Thing id.
 * @apiError {text} 401/Unauthorized.
 * @apiError {text} 403/Forbidden Required field [...] omitted.
 *
 * @apiSuccess {Array} Category list.
 * @apiExample {curl} Example usage:
 *    curl -i https://legacy-api.afrostream.tv/api/categorys/meas
 * @apiSampleRequest https://legacy-api.afrostream.tv/api/categorys/meas
 */

/**
 * @api {get} /api/categorys/:id/spots Request All AdSpot for HomePage Carousel
 * @apiName GetAdSpots
 * @apiGroup AdSpots
 *
 * @apiParam {Number} id Category unique ID.
 * @apiHeader Authorization Basic Access Authentication token.
 * @apiHeader Content-Type (application/x-www-form-urlencoded, application/json, application/xml).
 * @apiSuccess (Success 201) {text} Location URI of created Thing.
 * @apiSuccess (Success 201) {text} body Thing id.
 * @apiError {text} 401/Unauthorized.
 * @apiError {text} 403/Forbidden Required field [...] omitted.
 *
 * @apiSuccess {Array} Movie AdSpot list.
 * @apiExample {curl} Example usage:
 *    curl -i https://legacy-api.afrostream.tv/api/categorys/1/spots
 * @apiSampleRequest https://legacy-api.afrostream.tv/api/categorys/1/spots
 */

var express = require('express');
var controller = require('./category.controller.js');
var auth = rootRequire('/app/auth/auth.service');
var utils = rootRequire('/app/api/utils.js');
var router = express.Router();

router.use(auth.middleware.restrictRoutesToAuthentified());

router.get('/', utils.middlewareCache, controller.index);
router.get('/menu', utils.middlewareCache, controller.menu);
router.get('/meas', utils.middlewareCache, controller.mea);
router.get('/spots', utils.middlewareCache, controller.allSpots);
router.get('/:id', utils.middlewareCache, controller.show);
router.get('/:id/spots', utils.middlewareCache, controller.adSpot);
router.post('/', utils.middlewareNoCache, auth.hasRole('admin'), controller.create);
router.put('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.update);
router.patch('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.update);
router.delete('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.destroy);

module.exports = router;
