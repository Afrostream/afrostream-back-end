'use strict';

var express = require('express');
var router = express.Router();

router.use('/themes', require('./theme/index'));
router.use('/pins', require('./pin/index'));
router.use('/spots', require('./spot/index'));

module.exports = router;