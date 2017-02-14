'use strict';

/**
 * @api {put} /api/users/:userId/videos/:videoId Update User-Video Association
 * @apiName putUsersVideos
 * @apiDescription this api call create/update the association data between a user and a video (audio language, caption language, rating, player position)
 * this api is called on video start/end/seek, or every 60sec during play
 * @apiGroup User-Videos
 *
 * @apiParam (putData) {String} playerAudio (optionnal, ISO6392T 3 letters lowercase)
 * @apiParam (putData) {String} playerCaption (optionnal, ISO6392T 3 letters lowercase)
 * @apiParam (putData) {Integer} playerPosition (optionnal, position in "seconds", auto-update dateLastRead if set)
 * @apiParam (putData) {Integer} rating (optionnal, rating, enum:{ 1, 2, 3, 4, 5 })
 *
 * @apiSuccessExample {json} Success-Response (empty json) :
 *   HTTP/1.1 200 OK
 *   {
 *   }
 * @apiError (403) {String} error message
 * @apiError (500) {String} error message
 */

 /**
  * @api {get} /api/users/:userId/videos/:videoId Read User-Video Association
  * @apiName getUsersVideos
  * @apiDescription this api call read the association data between a user and a video (audio language, caption language, rating, player position)
  * @apiGroup User-Videos
  *
  * @apiSuccess {Integer} userId
  * @apiSuccess {UUID} videoId
  * @apiSuccess {Date} dataStartRead
  * @apiSuccess {Date} dateLastRead date of last playerPosition update
  * @apiSuccess {String} playerAudio ISO6392T 3 letters lowercase, null if none
  * @apiSuccess {String} playerCaption ISO6392T 3 letters lowercase, null if none
  * @apiSuccess {Integer} playerPosition position in "seconds", null if none
  * @apiSuccess {Integer} rating enum:{ 1, 2, 3, 4, 5 }, null if none
  * @apiSuccessExample {json} Success-Response :
  *   HTTP/1.1 200 OK
  *   {
  *     "_id":4065487,
  *     "userId":1,
  *     "videoId":"a58f7a12-b23a-43fc-8a84-195636e9f7d4",
  *     "dateStartRead":"2016-06-07T12:39:58.000Z",
  *     "dateLastRead":"2016-06-07T12:40:10.195Z",
  *     "playerPosition":273,
  *     "playerAudio":"fra",
  *     "playerCaption":"fr",
  *     "rating":null
  *   }
  * @apiError (403) {String} error message
  * @apiError (500) {String} error message
  */

const express = require('express');
const controller = require('./video.controller.js');
const auth = rootRequire('app/api/v1/auth/auth.service');
const router = express.Router({mergeParams:true});

const convertUserIdMeToUserId = (req, res, next) => {
  if (req.params && req.params.userId === 'me' && req.user) {
    req.params.userId = String(req.user._id);
  }
  next();
};

const tokenUserMatchParamUser = (req, res, next) => {
  if (String(req.params.userId) === String(req.user._id)) {
    next();
  } else {
    res.status(401).json({error: 'userId param/token mismatch.'});
  }
};

// 2016-01: hack for orange & wiztivi
// POST /api/users/:userId/videos/:videoId is now an alias/duplicate of the PUT route.
//  (orange servers cannot proxy PUT requests...)
router.post('/:videoId', auth.isAuthenticated(), convertUserIdMeToUserId, tokenUserMatchParamUser, controller.update);
//
router.put('/:videoId', auth.isAuthenticated(), convertUserIdMeToUserId, tokenUserMatchParamUser, controller.update);
router.get('/:videoId', auth.isAuthenticated(), convertUserIdMeToUserId, tokenUserMatchParamUser, controller.show);
router.get('/', auth.isAuthenticated(), convertUserIdMeToUserId, tokenUserMatchParamUser, controller.index);

module.exports = router;
