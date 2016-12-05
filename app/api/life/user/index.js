'use strict';

const express = require('express');
const controller = require('./lifeUser.controller.js');
const auth = rootRequire('app/auth/auth.service');
const utils = rootRequire('app/api/utils.js');
const router = express.Router();

router.use(auth.middleware.restrictRoutesToAuthentified());

router.use('/:userId/pins', require('./pin'));

router.get('/', utils.middlewareCache, controller.index);
router.get('/:id', utils.middlewareCache, controller.show);


module.exports = router;
