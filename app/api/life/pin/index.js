'use strict';

const express = require('express');
const controller = require('./pin.controller.js');
const auth = rootRequire('app/auth/auth.service');
const utils = rootRequire('app/api/utils.js');
const router = express.Router();

router.use(auth.middleware.restrictRoutesToAuthentified());

router.get('/', utils.middlewareCache, controller.index);
router.get('/:id', utils.middlewareCache, controller.show);
router.post('/scrap', utils.middlewareNoCache, controller.scrap);
router.post('/', utils.middlewareNoCache, controller.create);
router.put('/:id', utils.middlewareNoCache, utils.tokenUserMatchParamUser, controller.update);
router.patch('/:id', utils.middlewareNoCache, utils.tokenUserMatchParamUser, controller.update);
router.delete('/:id', utils.middlewareNoCache, utils.tokenUserMatchParamUser, controller.destroy);

module.exports = router;
