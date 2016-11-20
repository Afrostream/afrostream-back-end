'use strict';

var express = require('express');
var controller = require('./authCode.controller.js');
var auth = rootRequire('app/auth/auth.service');
var utils = rootRequire('app/api/utils.js');
var router = express.Router();

router.get('/', utils.middlewareNoCache, auth.hasRole('admin'), controller.index);
router.get('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.show);
router.post('/', utils.middlewareNoCache, auth.hasRole('admin'), controller.create);
router.put('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.update);
router.patch('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.update);
router.delete('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.destroy);

module.exports = router;
