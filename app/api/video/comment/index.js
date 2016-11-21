'use strict';

const express = require('express');
const controller = require('./comment.controller.js');
const auth = rootRequire('app/auth/auth.service');
const router = express.Router({mergeParams:true});

router.get('/', auth.isAuthenticated(), controller.index);
router.post('/:commentId', auth.isAuthenticated(), controller.show);
router.put('/:commentId', auth.isAuthenticated(), controller.update);
router.delete('/:commentId', auth.isAuthenticated(), controller.delete);
router.post('/', auth.isAuthenticated(), controller.create);

module.exports = router;
