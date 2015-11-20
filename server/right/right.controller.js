'use strict';

var passport = require('passport');

function handleError(req, res) {
  return function (err) {
    console.error('DRM: ' + req.originalUrl + ' not granted with the error ', err);
    res.json({
      message: 'not granted',
      redirectUrl: 'https://afrostream.tv' // FIXME.
    });
  };
}

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
  passport.authenticate('bearer', {session: false}, function (err, user, info) {
    if (err) {
      return handleError(req, res)(err);
    }
    if (!user) {
      return handleError(req, res)('user does not exist');
    }
    if (String(userId) !== String(user._id)) {
      return handleError(req, res)('userId mismatch userTokenId');
    }
    res.json({
      "accountingId":"fake accountingId", // FIXME.
      "profile": {
        "purchase" : {}
      },
      "message":"granted"
    });
  })(req, res, next);
};