'use strict';

var passport = require('passport');

var Q = require('q');

var Video = require('../sqldb').Video;

var authenticate = function (req, res, next) {
  var deferred = Q.defer();
  passport.authenticate('bearer', {session: false}, function (err, user, info) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve([user, info]);
    }
  })(req, res, next);
  return deferred.promise;
};

module.exports.drmtodayCallback = function (req, res, next) {
  var accessToken = req.query.sessionId;
  var userId = req.params.userId;
  var encodingId = req.params.assetId;

  // simulating bearer auth
  req.headers.authorization = 'Bearer ' + accessToken;

  // route headers
  res.set('Cache-Control', 'public, max-age=0'); // we cannot cache this route
  res.set('Content-Type', 'application/json');

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
      })
    })
    .then(
      function success() {
        console.log('DRM: ' + req.originalUrl + ' granted !');
        res.json({
          "accountingId":"fake accountingId", // FIXME.
          "profile": {
            "purchase" : {}
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