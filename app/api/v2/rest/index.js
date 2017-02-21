const express = require('express');
const router = express.Router();

// backward compatibility
router.use('/broadcasters', rootRequire('/app/api/v1/rest/broadcaster/index'));
router.use('/posts', rootRequire('/app/api/v1/rest/post/index'));
router.use('/actors', rootRequire('/app/api/v1/rest/actor/index'));
router.use('/billings', rootRequire('/app/api/v1/rest/billing/index'));
router.use('/catchup', rootRequire('/app/api/v1/rest/catchup/index'));
router.use('/configs', rootRequire('/app/api/v1/rest/config/index'));
router.use('/subscriptions', rootRequire('/app/api/v1/rest/subscription/index'));
router.use('/refreshTokens', rootRequire('/app/api/v1/rest/refreshToken/index'));
router.use('/accessTokens', rootRequire('/app/api/v1/rest/accessToken/index'));
router.use('/authCodes', rootRequire('/app/api/v1/rest/authCode/index'));
router.use('/clients', rootRequire('/app/api/v1/rest/client/index'));
router.use('/policy', rootRequire('/app/api/v1/rest/policy'));
router.use('/cgu', rootRequire('/app/api/v1/rest/cgu'));
router.use('/countries', rootRequire('/app/api/v1/rest/country/index'));
router.use('/genres', rootRequire('/app/api/v1/rest/genre/index'));
router.use('/licensors', rootRequire('/app/api/v1/rest/licensor/index'));
router.use('/languages', rootRequire('/app/api/v1/rest/language/index'));
router.use('/legals', rootRequire('/app/api/v1/rest/legals'));
router.use('/logs', rootRequire('/app/api/v1/rest/log/index'));
router.use('/comments', rootRequire('/app/api/v1/rest/comment/index'));
router.use('/captions', rootRequire('/app/api/v1/rest/caption/index'));
router.use('/videos', rootRequire('/app/api/v1/rest/video/index'));
router.use('/images', rootRequire('/app/api/v1/rest/image/index'));
router.use('/jobs', rootRequire('/app/api/v1/rest/job/index'));
router.use('/episodes', rootRequire('/app/api/v1/rest/episode/index'));
router.use('/seasons', rootRequire('/app/api/v1/rest/season/index'));
router.use('/tags', rootRequire('/app/api/v1/rest/tag/index'));
router.use('/categorys', rootRequire('/app/api/v1/rest/category/index'));
router.use('/movies', rootRequire('/app/api/v1/rest/movie/index'));
router.use('/press', rootRequire('/app/api/v1/rest/press/index'));
router.use('/search', rootRequire('/app/api/v1/rest/search/index'));
router.use('/series', rootRequire('/app/api/v1/rest/movie/index'));
router.use('/users', rootRequire('/app/api/v1/rest/user/index'));
router.use('/dashboard', rootRequire('/app/api/v1/rest/dashboard/index'));
router.use('/pf', rootRequire('/app/api/v1/rest/pf/index'));
router.use('/usersvideos', rootRequire('/app/api/v1/rest/usersvideos/index'));
router.use('/waitingUsers', rootRequire('/app/api/v1/rest/waitingUser/index'));
router.use('/widgets', rootRequire('/app/api/v1/rest/widget/index'));
router.use('/works', rootRequire('/app/api/v1/rest/work/index'));
router.use('/wallnotes', rootRequire('/app/api/v1/rest/wallnote/index'));
router.use('/stats', rootRequire('/app/api/v1/rest/stat/index'));
router.use('/stores', rootRequire('/app/api/v1/rest/store/index'));

router.use('/player', rootRequire('/app/api/v1/rest/player/index'));
router.use('/cdnselector', rootRequire('/app/api/v1/rest/cdnselector/index'));

router.use('/exchanges', rootRequire('/app/api/v1/rest/exchange'));

//LIFE
router.use('/life', rootRequire('/app/api/v1/rest/life'));

module.exports = router;
