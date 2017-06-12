'use strict';

const express = require('express');
const controller = require('./nodePF.controller.js');
const auth = rootRequire('app/auth/auth.service');
const router = express.Router();

router.use(auth.middleware.restrictRoutesToAuthentified());

router.get('/contents', controller.index);

module.exports = router;
