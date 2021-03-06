'use strict';
const express = require('express');
const controller = require('./search.controller.js');
const auth = rootRequire('app/auth/auth.service');
const utils = rootRequire('app/api/utils.js');
const router = express.Router();

router.use(auth.middleware.restrictRoutesToAuthentified());

router.post('/', utils.middlewareNoCache, controller.search);

module.exports = router;
