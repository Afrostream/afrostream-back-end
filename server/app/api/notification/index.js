'use strict';

var express = require('express');
var controller = require('./notification.controller.js');
var auth = rootRequire('/server/auth/auth.service');
var utils = rootRequire('/server/app/api/utils.js');
var router = express.Router();

//router.use(auth.middleware.restrictRoutesToAuthentified());

//router.get('/', utils.middlewareCache, controller.index);
//router.get('/:id', utils.middlewareCache, controller.show);
//router.post('/', utils.middlewareNoCache, auth.hasRole('admin'), controller.create);
//router.put('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.update);
//router.patch('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.update);
//router.delete('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.destroy);
router.post('/:id/deploy', utils.middlewareNoCache, controller.deploy);

module.exports = router;
