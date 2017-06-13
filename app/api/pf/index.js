'use strict';

const express = require('express');
const controller = require('./pf.controller.js');
const auth = rootRequire('app/auth/auth.service');
const utils = rootRequire('app/api/utils.js');
const router = express.Router();

router.use(auth.middleware.restrictRoutesToAuthentified());

router.get('/contents', utils.middlewareNoCache, auth.hasRole('admin'), controller.contents);
router.get("/transcode", utils.middlewareNoCache, auth.hasRole('admin'), controller.transcode);

module.exports = router;
