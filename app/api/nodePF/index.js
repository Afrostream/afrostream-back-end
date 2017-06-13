'use strict';

const express = require('express');
const controller = require('./nodePF.controller.js');
const auth = rootRequire('app/auth/auth.service');
const router = express.Router();

router.use(auth.middleware.restrictRoutesToAuthentified());

router.get('/contents', controller.contents.index);
router.get('/profiles', controller.profiles.index);

router.get('/uploadToBouyguesSFTP', controller.uploadToBouyguesSFTP);

module.exports = router;
