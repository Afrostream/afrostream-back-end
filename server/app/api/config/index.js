var express = require('express');
var controller = require('./config.controller.js');
var auth = rootRequire('/server/auth/auth.service');
var router = express.Router();

router.use(auth.middleware.restrictRoutesToAuthentified());

router.get('/', auth.hasRole('admin'), controller.index);
router.post('/', auth.hasRole('admin'), controller.create);
router.get('/client', auth.hasRole('admin'), controller.client);
router.get('/:target', controller.target);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);

module.exports = router;
