'use strict';

var Video = require('../sqldb').Video;

var authenticate = require('../auth/auth.service').authenticate;

module.exports.drmtodayCallback = function (req, res, next) {
  var accessToken = req.query.sessionId;
  var userId = req.params.userId;
  var encodingId = req.params.assetId;

  // simulating bearer auth
  req.headers.authorization = 'Bearer ' + accessToken;

  // route headers
  res.noCache(); // we cannot cache this route
  res.set('Content-Type', 'application/json');

  //
  // hack, test orange, to be removed !
  // BEGIN HACK
  if (userId === '12345') {
    return Video.find({where: {encodingId: encodingId}}).then(function (video) {
      if (!video) throw 'unknown asset '+encodingId;
      return video;
    }).then(
      function (video) { return video; },
      function (err) { return { _id: 'unknown', name: 'unknown' }; }
    ).then(function (video) {
      res.json({
        "accountingId": userId + ":" + video._id + ":" + video.name,
        "profile": {
          "rental": {
            "absoluteExpiration": new Date(new Date().getTime() + 1000 * 3600 * 24).toISOString(), // 1 day
            "playDuration": 1000 * 3600 * 12 // 12 hours
          }
        },
        "message": "granted"
      });
    });
  }
  // END HACK

  // we check if the user exist & if the accessToken is valid.
  authenticate(req, res, next)
    .then(function checkUser(data) {
      var user = data[0], info = data[1];
      // unknown user => break
      if (!user) {
        throw 'user does not exist';
      }
      if (String(userId) !== String(user._id)) {
        throw 'userId mismatch userTokenId';
      }
    })
    .then(function checkAsset() {
      return Video.find({where: {encodingId: encodingId}}).then(function (video) {
        if (!video) throw 'unknown asset '+encodingId;
        return video;
      })
    })
    .then(
      function success(video) {
        console.log('DRM: ' + req.originalUrl + ' granted !');
        res.json({
          "accountingId": userId + ":" + video._id + ":" + video.name,
          "profile": {
            "rental" : {
              "absoluteExpiration" : new Date(new Date().getTime() + 1000 * 3600* 24).toISOString(), // 1 day
              "playDuration" : 1000 * 3600 * 12 // 12 hours
            }
          },
          "message":"granted"
        });
      },
      function error(err) {
        console.error('DRM: ' + req.originalUrl + ' not granted with the error ', err);
        res.json({
          message: 'not granted',
          redirectUrl: 'https://afrostream.tv' // FIXME.
        });
      }
    );
};