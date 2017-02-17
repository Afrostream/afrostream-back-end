'use strict';

const express = require('express');
const controller = require('./job.controller.js');
const auth = rootRequire('app/api/v1/auth/auth.service');
const utils = rootRequire('app/api/v1/rest/utils.js');
const router = express.Router();

// these route create jobs : browser/client => afrostream-backend => afrostream-jobs => execute job somewhere else.
router.post('/', utils.middlewareNoCache, auth.hasRole('admin'), controller.create);
router.post('/catchup-bet', utils.middlewareNoCache, controller.catchupBet);

// used for manual trigger
// https://admin.afrostream.tv/api/jobs/pack-caption?encodingId=...
// https://admin.afrostream.tv/api/jobs/pack-caption?videoId=...
// https://admin.afrostream.tv/api/jobs/pack-caption?pfMd5Sum=...
router.get('/pack-caption', utils.middlewareNoCache, controller.packCaption);

module.exports = router;
