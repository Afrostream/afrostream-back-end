'use strict';

var express = require('express');
var controller = require('./image.controller.js');
var auth = rootRequire('app/auth/auth.service');
var utils = rootRequire('app/api/utils.js');
var middlewareReadFile = rootRequire('app/middlewares/middleware-readfile.js');
var router = express.Router();

router.use(auth.middleware.restrictRoutesToAuthentified());

router.get('/', utils.middlewareCache, controller.index);
router.get('/:id', utils.middlewareCache, controller.show);
router.post('/', utils.middlewareNoCache, auth.hasRole('admin'), middlewareReadFile(), controller.create);
router.put('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.update);
router.patch('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.update);

module.exports = router;
