const express = require('express');
const auth = rootRequire('app/auth/auth.service');
const utils = rootRequire('app/api/utils.js');
const router = express.Router();

router.use(auth.middleware.restrictRoutesToAuthentified(), utils.middlewareNoCache, auth.hasRole('admin'));

router.use('/lists', require('./list'));
router.use('/subscribers', require('./subscriber'));
router.use('/providers', require('./provider'));
router.use('/workers', require('./worker'));
router.use('/templates', require('./template'));
router.use('/transactions', require('./transaction'));

module.exports = router;
