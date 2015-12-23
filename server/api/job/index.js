'use strict';

var express = require('express');
var controller = require('./job.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

// these route create jobs : browser/client => afrostream-backend => afrostream-jobs => execute job somewhere else.
router.post('/', auth.hasRole('admin'), controller.create);

router.post('/catchup-bet', controller.catchupBet);

module.exports = router;
