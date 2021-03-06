'use strict';

const express = require('express');
const controller = require('./refreshToken.controller.js');
const auth = rootRequire('app/auth/auth.service');
const utils = rootRequire('app/api/utils.js');
const router = express.Router();

router.get('/', utils.middlewareNoCache, auth.hasRole('admin'), controller.index);
router.get('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.show);
router.post('/', utils.middlewareNoCache, auth.hasRole('admin'), controller.create);
router.put('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.update);
router.patch('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.update);
router.delete('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.destroy);

module.exports = router;
