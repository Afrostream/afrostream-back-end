'use strict';

var express = require('express');
var controller = require('./comment.controller.js');
var auth = rootRequire('/server/auth/auth.service');

var router = express.Router();

router.use(auth.middleware.restrictRoutesToAuthentified());

router.get('/', controller.index);
router.get('/:id', controller.show);
router.post('/', controller.create);
router.put('/:id', auth.hasRole('admin'), controller.update);
router.patch('/:id', auth.hasRole('admin'), controller.update);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);

module.exports = router;
