'use strict';

var express = require('express');
var controller = require('./image.controller.js');
var auth = rootRequire('/server/auth/auth.service');

var middlewareReadFile = rootRequire('/server/app/middlewares/middleware-readfile.js');

var router = express.Router();

router.use(auth.middleware.restrictRoutesToAuthentified());

router.get('/', controller.index);
router.get('/:id', controller.show);
router.post('/', auth.hasRole('admin'), middlewareReadFile(), controller.create);
router.put('/:id', auth.hasRole('admin'), controller.update);
router.patch('/:id', auth.hasRole('admin'), controller.update);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);

module.exports = router;
