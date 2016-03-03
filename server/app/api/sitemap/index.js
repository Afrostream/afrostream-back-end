'use strict';

/**
 * @api {get} /api/gatalog Request Catalog information
 * @apiName GetCatalog
 * @apiGroup Catalog
 *
 * @apiHeader Authorization Basic Access Authentication token.
 * @apiHeader Content-Type (application/x-www-form-urlencoded, application/json, application/xml).
 * @apiSuccess (Success 201) {text} Location URI of created Thing.
 * @apiSuccess (Success 201) {text} body Thing id.
 * @apiError {text} 401/Unauthorized.
 * @apiError {text} 403/Forbidden Required field [...] omitted.
 *
 * @apiSuccess {Object} Movie/Season/Video/Epidode.
 *    curl -i https://legacy-api.afrostream.tv/api/catalog
 * @apiSampleRequest https://legacy-api.afrostream.tv/api/catalog
 */

var express = require('express');
var controller = require('./sitemap.controller.js');

var router = express.Router();

router.get('/', controller.index);

module.exports = router;
