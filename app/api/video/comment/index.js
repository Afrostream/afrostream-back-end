'use strict';

var express = require('express');
var controller = require('./comment.controller.js');
var auth = rootRequire('app/auth/auth.service');
var router = express.Router({mergeParams:true});

router.get('/', auth.isAuthenticated(), controller.index);
router.post('/:commentId', auth.isAuthenticated(), controller.show);
router.put('/:commentId', auth.isAuthenticated(), controller.update);
router.delete('/:commentId', auth.isAuthenticated(), controller.delete);
router.post('/', auth.isAuthenticated(), controller.create);

module.exports = router;
