'use strict';

var express = require('express');
var router = express.Router();

router.use('/pins', require('./pin/index'));
router.use('/themes', require('./theme/index'));

module.exports = router;