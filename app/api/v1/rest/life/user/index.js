'use strict';

const express = require('express');
const controller = require('./lifeUser.controller.js');
const auth = rootRequire('app/api/v1/auth/auth.service');
const utils = rootRequire('app/api/v1/rest/utils.js');
const router = express.Router();

router.use(auth.middleware.restrictRoutesToAuthentified());

router.use('/:userId/pins', require('./pin'));
router.use('/:userId/follow', require('./userFollow'));

router.get('/', utils.middlewareCache, controller.index);
router.get('/:id', utils.middlewareNoCache, controller.show);

module.exports = router;
