'use strict';

const express = require('express');
const controller = require('./dashboard.controller.js');
const auth = rootRequire('app/auth/auth.service');
const utils = rootRequire('app/api/utils.js');
const router = express.Router();

router.get('/', utils.middlewareNoCache, auth.hasRole('admin'), controller.index);

module.exports = router;
