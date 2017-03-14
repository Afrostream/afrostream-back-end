'use strict';

const express = require('express');
const controller = require('./notification.controller.js');
const auth = rootRequire('app/api/v1/auth/auth.service');
const utils = rootRequire('app/api/v1/rest/utils.js');
const router = express.Router();

router.use(auth.middleware.restrictRoutesToAuthentified());
//
router.get('/', utils.middlewareCache, controller.index);
router.get('/:id', utils.middlewareCache, auth.hasRole('admin'), controller.show);
router.post('/', utils.middlewareNoCache, auth.hasRole('admin'), controller.create);
router.put('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.update);
router.patch('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.update);
router.delete('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.destroy);
router.put('/:id/deploy', utils.middlewareNoCache, auth.hasRole('admin'), controller.deploy);

module.exports = router;
