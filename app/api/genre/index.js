'use strict';

/**
 * @api {get} /api/genres/:id Request Genre information
 * @apiName GetGenre
 * @apiGroup Genre
 *
 * @apiParam {Number} id Genre unique ID.
 *
 * @apiSuccess {String} name Name of the Episode.
 * @apiSuccess {String} bouyguesIngridName bouygues name.
 * @apiSuccess {String} bouyguesIngridCode bouygues code.
 */

/**
 * @api {get} /api/genres/ Request Genre list
 * @apiName GetGenres
 * @apiGroup Genre
 */

const express = require('express');
const controller = require('./genre.controller.js');
const auth = rootRequire('app/auth/auth.service');
const utils = rootRequire('app/api/utils.js');
const router = express.Router();

router.use(auth.middleware.restrictRoutesToAuthentified());

router.get('/', utils.middlewareCache, controller.index);
router.get('/:id', utils.middlewareCache, controller.show);

module.exports = router;
