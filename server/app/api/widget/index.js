var express = require('express');
var controller = require('./widget.controller.js');
var auth = rootRequire('/server/auth/auth.service');
var router = express.Router();

router.use(auth.middleware.restrictRoutesToAuthentified());

router.get('/', auth.hasRole('admin'), controller.index);
router.post('/', auth.hasRole('admin'), controller.create);
router.get('/:id', auth.hasRole('admin'), controller.show);
router.put('/:id', auth.hasRole('admin'), controller.update);
router.patch('/:id', auth.hasRole('admin'), controller.update);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);

module.exports = router;