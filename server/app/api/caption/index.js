'use strict';

var express = require('express');
var controller = require('./caption.controller.js');
var auth = rootRequire('/server/auth/auth.service');
var middlewareReadFile = rootRequire('/server/app/middlewares/middleware-readfile.js');
var utils = rootRequire('/server/app/api/utils.js');
var router = express.Router();

router.use(auth.middleware.restrictRoutesToAuthentified());

router.get('/', controller.index);
router.get('/:id', controller.show);
router.post('/', utils.middlewareNoCache, auth.hasRole('admin'), middlewareReadFile(), controller.create);
router.put('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.update);
router.patch('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.update);
router.delete('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.destroy);

module.exports = router;
