'use strict';

const express = require('express');
const controller = require('./caption.controller.js');
const auth = rootRequire('app/auth/auth.service');
const middlewareReadFile = rootRequire('app/middlewares/middleware-readfile.js');
const utils = rootRequire('app/api/utils.js');
const router = express.Router();

router.use(auth.middleware.restrictRoutesToAuthentified());

router.get('/', utils.middlewareCache, controller.index);
router.get('/:id', utils.middlewareCache, controller.show);
router.post('/', utils.middlewareNoCache, auth.hasRole('admin'), middlewareReadFile(), controller.create);
router.put('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.update);
router.patch('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.update);
router.delete('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.destroy);

module.exports = router;
