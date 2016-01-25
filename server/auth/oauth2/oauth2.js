var oauth2orize = require('oauth2orize');
var passport = require('passport');
var crypto = require('crypto');
var utils = require('./utils');
var config = require('../../config');
var Client = require('../../sqldb').Client;
var User = require('../../sqldb').User;
var AuthCode = require('../../sqldb').AuthCode;
var AccessToken = require('../../sqldb').AccessToken;
var RefreshToken = require('../../sqldb').RefreshToken;
// create OAuth 2.0 server
var server = oauth2orize.createServer();
server.serializeClient(function (client, done) {
  return done(null, client._id);
});

server.deserializeClient(function (id, done) {
  Client.find({
      where: {
        _id: id
      }
    })
    .then(function (client) {
      return done(null, client);
    })
    .catch(function (err) {
      return done(err);
    });
});


var generateTokenData = function (client, user, code) {
  var token = utils.uid(256);
  var refreshToken = utils.uid(256);
  var tokenHash = crypto.createHash('sha1', config.secrets.session).update(token).digest('hex');
  var refreshTokenHash = crypto.createHash('sha1', config.secrets.session).update(refreshToken).digest('hex');
  var expiresIn = config.secrets.expire;
  var expirationDate = new Date(new Date().getTime() + (expiresIn * 1000));
  var clientId = null;
  var userId = null;

  if (client !== null) {
    clientId = client._id;
  }
  if (user !== null) {
    userId = user._id;
  }
  if (code !== null) {
    clientId = code.clientId;
    userId = code.userId;
  }

  return {
    token: tokenHash,
    refresh: refreshTokenHash,
    clientId: clientId,
    userId: userId,
    expirationDate: expirationDate, // date
    expirationTimespan: expiresIn   // int (seconds)
  }
};

var generateToken = function (client, user, code, userIp, userAgent, done) {
  var tokenData = generateTokenData(client, user, code);

  // logs accessToken (duplicate with db)
  console.log('[AUTH]: ' +
    'client=' + tokenData.clientId + ' ' +
    'user=' + tokenData.userId + ' ' +
    'userIp=' + userIp + ' ' +
    'accessToken=' + tokenData.token);

  //
  AccessToken.create({
      token: tokenData.token,
      clientId: tokenData.clientId,
      userId: tokenData.userId,
      expirationDate: tokenData.expirationDate,
      expirationTimespan: tokenData.expirationTimespan,
      userIp: userIp || null,
      userAgent: userAgent
    })
    .then(function (tokenEntity) {
      if (client === null) {
        return done(null, tokenEntity.token, null, {expires_in: tokenEntity.expirationTimespan});
      }

      RefreshToken.create({
          token: tokenData.refresh,
          clientId: tokenData.clientId,
          userId: tokenData.userId
        })
        .then(function (refreshTokenEntity) {
          console.log('refreshTokenEntity', refreshTokenEntity.token);
          return done(null, tokenEntity.token, refreshTokenEntity.token, {expires_in: tokenEntity.expirationTimespan});
        }).catch(function (err) {
        console.log('RefreshToken', err);
        return done(err)
      });

    }).catch(function (err) {
    console.log('AccessToken', err);
    return done(err)
  });
};

var refreshAccessToken = function (client, userId) {
  var user = userId ? {_id: userId} : null; // yeark...
  var tokenData = generateTokenData(client, user, null);

  return AccessToken.find({
      where: {
        clientId: client._id,
        userId: userId
      }
    })
    .then(function (accessToken) {
      if (!accessToken) throw "missing access token";
      return accessToken.updateAttributes({
        token: tokenData.token,
        expirationDate: tokenData.expirationDate,
        expirationTimespan: tokenData.expirationTimespan
      });
    });
};

/*
server.grant(oauth2orize.grant.code(function (client, redirectURI, user, ares, done) {
  AuthCode.create({clientId: client._id, redirectURI: redirectURI, userId: user._id})
    .then(function (entity) {
      done(null, entity.code);
    }).catch(function (err) {
    return done(err);
  });
}));

server.grant(oauth2orize.grant.token(function (client, user, ares, done) {
  return generateToken(client, user, null, done);
}));

server.exchange(oauth2orize.exchange.code(function (client, code, redirectURI, done) {
  AuthCode.find({
    where: {
      _id: code
    }
  }).then(function (entity) {
    if (!entity) {
      return done(404);
    }
    if (entity.code === undefined) {
      return done(null, false);
    }
    if (client._id !== entity.clientID) {
      return done(null, false);
    }
    if (redirectURI !== entity.redirectURI) {
      return done(null, false);
    }

    entity.destroy().then(function () {
        return generateToken(null, null, entity, done);
      })
      .catch(function (err) {
        return done(err);
      });
  });
}));
*/

server.exchange(oauth2orize.exchange.password(function (client, username, password, scope, reqBody, done) {
  Client.find({
      where: {
        _id: client._id
      }
    })
    .then(function (entity) {
      if (entity === null) {
        return done(null, false);
      }
      if (entity.secret !== client.secret) {
        return done(null, false);
      }
      User.find({
          where: {
            email: {
              $iLike: username
            }
          }
        })
        .then(function (user) {
          if (user === null) {
            return done(null, false);
          }
          user.authenticate(password, function (authError, authenticated) {
            if (authError) {
              return done(authError);
            }
            if (!authenticated) {
              return done(null, false, {
                message: 'This password is not correct.'
              });
            } else {
              return generateToken(entity, user, null, reqBody.userIp, reqBody.userAgent, done);
            }
          });

        })
        .catch(function (err) {
          return done(err);
        });
    })
    .catch(function (err) {
      return done(err);
    });
}));

server.exchange(oauth2orize.exchange.clientCredentials(function (client, scope, reqBody, done) {
  Client.find({
      where: {
        _id: client._id
      }
    })
    .then(function (entity) {
      if (entity === null) {
        return done(null, false);
      }
      if (entity.secret !== client.secret) {
        return done(null, false);
      }
      return generateToken(entity, null, null, reqBody.userIp, reqBody.userAgent, done);
    })
    .catch(function (err) {
      return done(err);
    });
}));

server.exchange(oauth2orize.exchange.refreshToken(function (client, refreshTokenToken, scope, done) {
  RefreshToken.find({
      where: {
        token: refreshTokenToken
      }
    })
    .then(function (refreshToken) {
      if (!refreshToken) {
        throw new Error("missing refresh token");
      }
      if (refreshToken.clientId !== client._id) {
        throw new Error("clientId missmatch");
      }
      return refreshAccessToken(client, refreshToken.userId);
    }).then(function (accessToken) {
    done(null, accessToken.token, refreshTokenToken, {expires_in: accessToken.expirationTimespan});
  }).catch(done);
}));

exports.authorization = [
  server.authorization(function (clientID, redirectURI, done) {
    Client.find({
        where: {
          _id: clientID
        }
      })
      .then(function (client) {
        return done(null, client, redirectURI);
      })
      .catch(function (err) {
        return done(err);
      });
  }),
  function (req, res) {
    res.render('dialog', {transactionID: req.oauth2.transactionID, user: req.user, client: req.oauth2.client});
  }
];

exports.decision = [
  server.decision()
];

exports.token = [
  function (req, res, next) {
    // req.clientIp is the browser client ip
    req.body.userIp = req.clientIp;
    next();
  },
  passport.authenticate(['clientBasic', 'clientPassword'], {session: false}),
  server.token(),
  server.errorHandler()
];

exports.generateToken = generateToken;
