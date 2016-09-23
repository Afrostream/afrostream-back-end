var oauth2orize = require('oauth2orize');
var passport = require('passport');
var crypto = require('crypto');
var utils = require('./utils');
var config = rootRequire('/config');
var Client = rootRequire('/sqldb').Client;
var User = rootRequire('/sqldb').User;
var AuthCode = rootRequire('/sqldb').AuthCode;
var AccessToken = rootRequire('/sqldb').AccessToken;
var RefreshToken = rootRequire('/sqldb').RefreshToken;
var Log = rootRequire('/sqldb').Log;

var TokenError = oauth2orize.TokenError;

// custom oauth2 exchange
var exchangeBouygues = require('./exchange/bouygues.js');
var exchangeIse2 = require('./exchange/ise2.js');

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


var generateTokenData = function (client, user, code, expiresIn) {
  var token = utils.uid(256);
  var refreshToken = utils.uid(256);
  var tokenHash = crypto.createHash('sha1', config.secrets.session).update(token).digest('hex');
  var refreshTokenHash = crypto.createHash('sha1', config.secrets.session).update(refreshToken).digest('hex');
  expiresIn = expiresIn || config.secrets.expire;
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

var generateToken = function (client, user, code, userIp, userAgent, expireIn, done) {
  var tokenData = generateTokenData(client, user, code, expireIn);

  // log accessToken (duplicate with db)
  console.log('[AUTH]: ' +
    'client=' + tokenData.clientId + ' ' +
    'user=' + tokenData.userId + ' ' +
    'userIp=' + userIp + ' ' +
    'userAgent=' + userAgent + ' ' +
    'accessToken=' + tokenData.token);

  // logs
  Log.create({
    type: 'access_token',
    clientId: tokenData.clientId,
    userId: tokenData.userId,
    data: {
      token: tokenData.token,
      userIp: userIp || null,
      userAgent: userAgent
    }
  }).then(function () {
  }, function (err) {
    console.error(err);
  }); // can finish
  //
  AccessToken.create({
    token: tokenData.token,
    clientId: tokenData.clientId,
    userId: tokenData.userId,
    expirationDate: tokenData.expirationDate,
    expirationTimespan: tokenData.expirationTimespan
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
          return done(null, tokenEntity.token, refreshTokenEntity.token, {expires_in: tokenEntity.expirationTimespan});
        }).catch(function (err) {
        console.error('RefreshToken', err);
        return done(err)
      });

    }).catch(function (err) {
    console.error('AccessToken', err);
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
        return done(new TokenError('unknown client', 'invalid_grant'), false);
      }
      if (entity.secret !== client.secret) {
        return done(new TokenError('wrong secret', 'invalid_grant'), false);
      }
      return User.find({
        where: {
          email: {
            $iLike: username
          }
        }
      })
        .then(function (user) {
          if (user === null) {
            return done(new TokenError('unknown user', 'invalid_grant'), false);
          }
          if (entity.type === 'legacy-api.bouygues-miami' &&
            user.email.match(/@bbox\.fr$/i)) {
            return generateToken(entity, user, null, reqBody.userIp, reqBody.userAgent, null, done);
          }
          user.authenticate(password, function (authError, authenticated) {
            if (authError) {
              return done(authError);
            }
            if (!authenticated) {
              return done(new TokenError('wrong password', 'invalid_grant'), false);
            } else {
              return generateToken(entity, user, null, reqBody.userIp, reqBody.userAgent, null, done);
            }
          });
        });
    })
    .catch(function (err) {
      return done(err);
    });
}));

server.exchange(exchangeBouygues(function (client, id, scope, reqBody, done) {
  Client.find({
    where: {
      _id: client._id
    }
  })
    .then(function (entity) {
      if (entity === null) {
        return done(new TokenError('unknown client', 'invalid_grant'), false);
      }
      if (entity.secret !== client.secret) {
        return done(new TokenError('wrong secret', 'invalid_grant'), false);
      }
      User.find({
        where: {bouyguesId: id}
      })
        .then(function (user) {
          if (user === null) {
            return done(new TokenError('unknown bouyguesId', 'invalid_grant'), false);
          }
          return generateToken(entity, user, null, reqBody.userIp, reqBody.userAgent, null, done);
        })
        .catch(function (err) {
          return done(err);
        });
    })
    .catch(function (err) {
      return done(err);
    });
}));

server.exchange(exchangeIse2(function (client, id, scope, reqBody, done) {
  Client.find({
    where: {
      _id: client._id
    }
  })
    .then(function (entity) {
      if (entity === null) {
        console.error('[ERROR]: [AUTH]: [ISE2]: unknown client');
        return done(new TokenError('unknown client', 'invalid_grant'), false);
      }
      if (entity.secret !== client.secret) {
        console.error('[ERROR]: [AUTH]: [ISE2]: wrong secret');
        return done(new TokenError('wrong secret', 'invalid_grant'), false);
      }
      User.find({
        where: {ise2: id}
      })
        .then(function (user) {
          if (user === null) {
            console.error('[ERROR]: [AUTH]: [ISE2]: UNKNOWN_ISE2 ' + id + ' => invalid_grant');
            return done(new TokenError('UNKNOWN_ISE2:' + id, 'invalid_grant'), false);
          }
          return generateToken(entity, user, null, reqBody.userIp, reqBody.userAgent, null, done);
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
      return generateToken(entity, null, null, reqBody.userIp, reqBody.userAgent, null, done);
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
    req.body.userAgent = req.userAgent;
    next();
  },
  passport.authenticate(['clientBasic', 'clientPassword'], {session: false}),
  server.token(),
  server.errorHandler()
];

exports.generateToken = generateToken;
