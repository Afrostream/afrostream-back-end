'use strict';

const express = require('express');
const controller = require('./app.controller.js');
const auth = rootRequire('app/auth/auth.service');
const utils = rootRequire('app/api/utils.js');
const router = express.Router();

router.use(auth.middleware.restrictRoutesToAuthentified());

router.get('/config', utils.middlewareCache, controller.showConfig);

module.exports = router;
