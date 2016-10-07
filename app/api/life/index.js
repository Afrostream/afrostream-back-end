'use strict';

var express = require('express');
var router = express.Router();

router.use('/pins', require('./pin/index'));

module.exports = router;