'use strict';

var express = require('express');
var router = express.Router();

router.use('/broadcasters', require('./broadcaster/index'));
router.use('/posts', require('./post/index'));
router.use('/actors', require('./actor/index'));
router.use('/billings', require('./billing/index'));
router.use('/catchup', require('./catchup/index'));
router.use('/configs', require('./config/index'));
router.use('/subscriptions', require('./subscription/index'));
router.use('/refreshTokens', require('./refreshToken/index'));
router.use('/accessTokens', require('./accessToken/index'));
router.use('/authCodes', require('./authCode/index'));
router.use('/clients', require('./client/index'));
router.use('/policy', require('./policy'));
router.use('/cgu', require('./cgu'));
router.use('/countries', require('./country/index'));
router.use('/genres', require('./genre/index'));
router.use('/licensors', require('./licensor/index'));
router.use('/languages', require('./language/index'));
router.use('/legals', require('./legals'));
router.use('/logs', require('./log/index'));
router.use('/comments', require('./comment/index'));
router.use('/captions', require('./caption/index'));
router.use('/videos', require('./video/index'));
router.use('/images', require('./image/index'));
router.use('/jobs', require('./job/index'));
router.use('/assets', require('./asset/index'));
router.use('/episodes', require('./episode/index'));
router.use('/seasons', require('./season/index'));
router.use('/tags', require('./tag/index'));
router.use('/categorys', require('./category/index'));
router.use('/movies', require('./movie/index'));
router.use('/series', require('./movie/index'));
router.use('/users', require('./user/index'));
router.use('/mam', require('./mam/index'));
router.use('/dashboard', require('./dashboard/index'));
router.use('/usersvideos', require('./usersvideos/index'));
router.use('/waitingUsers', require('./waitingUser/index'));
router.use('/widgets', require('./widget/index'));
router.use('/works', require('./work/index'));
router.use('/wallnotes', require('./wallnote/index'));
router.use('/stats', require('./stat/index'));

router.use('/player', require('./player/index'));
router.use('/cdnselector', require('./cdnselector/index'));

router.use('/exchanges', require('./exchange'));

module.exports = router;
