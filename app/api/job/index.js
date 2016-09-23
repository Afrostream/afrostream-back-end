'use strict';

var express = require('express');
var controller = require('./job.controller.js');
var auth = rootRequire('/auth/auth.service');
var utils = rootRequire('/app/api/utils.js');
var router = express.Router();

// these route create jobs : browser/client => afrostream-backend => afrostream-jobs => execute job somewhere else.
router.post('/', utils.middlewareNoCache, auth.hasRole('admin'), controller.create);
router.post('/catchup-bet', utils.middlewareNoCache, controller.catchupBet);

// used for manual trigger
// https://admin.afrostream.tv/api/jobs/pack-caption?encodingId=...
// https://admin.afrostream.tv/api/jobs/pack-caption?videoId=...
// https://admin.afrostream.tv/api/jobs/pack-caption?pfMd5Sum=...
router.get('/pack-caption', utils.middlewareNoCache, controller.packCaption);

module.exports = router;
