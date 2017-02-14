const express = require('express');
const controller = require('./config.controller.js');
const auth = rootRequire('app/auth/auth.service');
const utils = rootRequire('app/api/utils.js');
const router = express.Router();

router.use(auth.middleware.restrictRoutesToAuthentified());

router.get('/', utils.middlewareNoCache, auth.hasRole('admin'), controller.index);
router.post('/', utils.middlewareNoCache, auth.hasRole('admin'), controller.create);
router.get('/client', utils.middlewareNoCache, auth.hasRole('admin'), controller.client);
router.get('/:target', utils.middlewareCache, controller.target);
router.delete('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.destroy);

module.exports = router;
