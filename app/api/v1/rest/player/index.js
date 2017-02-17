'use strict';

const express = require('express');
const controller = require('./player.controller.js');
const auth = rootRequire('app/api/v1/auth/auth.service');
const utils = rootRequire('app/api/v1/rest/utils.js');
const router = express.Router();

router.use(auth.middleware.restrictRoutesToAuthentified());

router.get('/config', utils.middlewareCache, controller.showConfig);

module.exports = router;
