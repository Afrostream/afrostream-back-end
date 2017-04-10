var oauth2orize = require('oauth2orize');
var oauth2orizeFacebook = require('../facebook/oauth2orize-facebook');
var passport = require('passport');
var crypto = require('crypto');
var utils = require('./utils');
var config = rootRequire('config');
var sqldb = rootRequire('sqldb');
var Client = rootRequire('sqldb').Client;
var User = rootRequire('sqldb').User;
var AccessToken = rootRequire('sqldb').AccessToken;
var RefreshToken = rootRequire('sqldb').RefreshToken;
var Log = rootRequire('sqldb').Log;

var TokenError = oauth2orize.TokenError;

// custom oauth2 exchange
var exchangeBouygues = require('./exchange/bouygues.js');
var exchangeIse2 = require('./exchange/ise2.js');

var logger = rootRequire('logger').prefix('AUTH');

const Q = require('q');

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
  };
};

const trySetAuthCookie = function (req, res, tokenEntity, refreshTokenEntity) {
  if (req && res) {
    req.logger.debug('SET AUTH COOKIE');
    res.cookie(
      config.cookies.auth.name,
      {
        version: 1,
        access_token: tokenEntity.token,
        refresh_token: refreshTokenEntity && refreshTokenEntity.token || null,
        expires_in: tokenEntity.expirationTimespan
      },
      {
        domain: config.cookies.auth.domain,
        path: config.cookies.auth.path,
        signed: true,
        expires: new Date(Date.now() + tokenEntity.expirationTimespan * 1000),
        httpOnly: config.cookies.auth.httpOnly,
        secure: config.cookies.auth.secure,
      }
    );
  }
};

var generateToken = function (options, done) {
  const { client, user, code, userIp, userAgent, expireIn } = options;

  const tokenData = generateTokenData(client, user, code, expireIn);

  // log accessToken (duplicate with db)
  logger.log(
    'client=' + tokenData.clientId + ' ' +
    'user=' + tokenData.userId + ' ' +
    'userIp=' + userIp + ' ' +
    'userAgent=' + userAgent + ' ' +
    'accessToken=' + tokenData.token
  );

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
  }).then(
    () => {},
    err => logger.error(err.message)
  );

  const c = {
    tokenEntity: null,
    refreshTokenEntity: null
  };

  return Q()
    .then(() => {
      return AccessToken.create({
        token: tokenData.token,
        clientId: tokenData.clientId,
        userId: tokenData.userId,
        expirationDate: tokenData.expirationDate,
        expirationTimespan: tokenData.expirationTimespan
      })
      .then(o => c.accessTokenEntity = o);
    })
    .then(() => {
      if (client === null) return;
      return RefreshToken.create({
        token: tokenData.refresh,
        clientId: tokenData.clientId,
        userId: tokenData.userId
      })
      .then(o => c.refreshTokenEntity = o);
    })
    .then(() => {
        trySetAuthCookie(options.req, options.res, c.accessTokenEntity, c.refreshTokenEntity);
        done(null, c.accessTokenEntity.token, c.refreshTokenEntity.token, {expires_in: c.accessTokenEntity.expirationTimespan});
      },
      err => {
        logger.error(err.message);
        done(err);
      }
    );
};

var refreshAccessToken = function (client, userId, options) {
  var user = userId ? {_id: userId} : null; // yeark...
  var tokenData = generateTokenData(client, user, null);
  options = options || {};

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
      })
        .then(refreshToken => {
          trySetAuthCookie(options.req, options.res, accessToken, refreshToken);
          return refreshToken;
        });
    });
};

server.exchange(oauth2orizeFacebook(function (client, profile, scope, done) {
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

      console.log('facebook.id', profile);

      var email = ( profile._json && profile._json.email) || (profile.emails && profile.emails.length && profile.emails[0].value ) || profile.email;

      var whereUser = [{'facebook.id': profile.id}];
      whereUser.push(sqldb.sequelize.where(
        sqldb.sequelize.fn('lower', sqldb.sequelize.col('email')),
        sqldb.sequelize.fn('lower', email)
      ));

      User.find({
        where: {
          $or: whereUser
        }
      })
        .then(function (user) {
          if (user === null) {
            return done(new TokenError('unknown facebook id', 'invalid_grant'), false);
          }
          // user exist => update
          user.name = user.name || profile.displayName || profile.name.familyName + ' ' + profile.name.givenName;
          user.biography = user.biography || profile._json.about;
          user.postalAddressCity = user.postalAddressCity || (profile._json.location && profile._json.location.name) || null;
          user.facebook = profile._json;
          return user.save();
        })
        .then(function (user) {
          return generateToken({
            client: entity,
            user: user,
            code: null,
            expireIn: null
          }, done);
        })
        .catch(function (err) {
          return done(err);
        });
    })
    .catch(function (err) {
      return done(err);
    });
}));

server.exchange(oauth2orize.exchange.password(function (client, username, password, scope, reqBody, reqAuthInfo, done) {
  reqAuthInfo = reqAuthInfo || {};

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
      console.log('EXCHANGE user.find ' + username);
      return User.find({
        where: sqldb.sequelize.where(
          sqldb.sequelize.fn('lower', sqldb.sequelize.col('email')),
          sqldb.sequelize.fn('lower', username)
        )
      })
        .then(function (user) {
          if (user === null) {
            return done(new TokenError('unknown user', 'invalid_grant'), false);
          }
          if (entity.type === 'legacy-api.bouygues-miami' &&
            user.email.match(/@bbox\.fr$/i)) {
            return generateToken({
              client: entity,
              user: user,
              code: null,
              userIp: reqBody.userIp,
              userAgent: reqBody.userAgent,
              expireIn: null,
              req: reqAuthInfo.req,
              res: reqAuthInfo.res
            }, done);
          }
          user.authenticate(password, function (authError, authenticated) {
            if (authError) {
              return done(authError);
            }
            if (!authenticated) {
              return done(new TokenError('wrong password', 'invalid_grant'), false);
            } else {
              return generateToken({
                client: entity,
                user: user,
                code: null,
                userIp: reqBody.userIp,
                userAgent: reqBody.userAgent,
                expireIn: null,
                req: reqAuthInfo.req,
                res: reqAuthInfo.res
              }, done);
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
          return generateToken({
            client: entity,
            user: user,
            code: null,
            userIp: reqBody.userIp,
            userAgent: reqBody.userAgent,
            expireIn: null
          }, done);
        })
        .catch(function (err) {
          return done(err);
        });
    })
    .catch(function (err) {
      return done(err);
    });
}));

// fixme: also refactor this function, function should nodeify
//   there should be only thrown errors
server.exchange(exchangeIse2(function (client, id, scope, reqBody, done) {
  var ise2Logger = logger.prefix('ISE2');

  Client.find({
    where: {
      _id: client._id
    }
  })
    .then(function (entity) {
      if (entity === null) {
        ise2Logger.error('unknown client');
        return done(new TokenError('unknown client', 'invalid_grant'), false);
      }
      if (entity.secret !== client.secret) {
        ise2Logger.error('wrong secret');
        return done(new TokenError('wrong secret', 'invalid_grant'), false);
      }
      return User.find({
        where: {ise2: id}
      })
        .then(function (user) {
          if (user === null) {
            ise2Logger.error('UNKNOWN_ISE2 ' + id + ' => invalid_grant');
            return done(new TokenError('UNKNOWN_ISE2:' + id, 'invalid_grant'), false);
          }
          return generateToken({
            client: entity,
            user: user,
            code: null,
            userIp: reqBody.userIp,
            userAgent: reqBody.userAgent,
            expireIn: null
          }, done);
        });
    })
    .catch(function (err) {
      return done(err);
    });
}));

server.exchange(oauth2orize.exchange.clientCredentials(function (client, scope, reqBody, reqAuthInfo, done) {
  reqAuthInfo = reqAuthInfo || {};

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
      return generateToken({
        client: entity,
        user: null,
        code: null,
        userIp: reqBody.userIp,
        userAgent: reqBody.userAgent,
        expireIn: null,
        req: reqAuthInfo.req,
        res: reqAuthInfo.res
      }, done);
    })
    .catch(function (err) {
      return done(err);
    });
}));

server.exchange(oauth2orize.exchange.refreshToken(function (client, refreshTokenToken, scope, reqBody, reqAuthInfo, done) {
  reqAuthInfo = reqAuthInfo || {};

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
      return refreshAccessToken(client, refreshToken.userId, {req: reqAuthInfo.req, res: reqAuthInfo.res});
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
    // FIXME: we do this because oauth2orize wasn't letting access to info
    //   but the newest release allow req.authInfo fwding ...
    //   we need to refactor all this (remove oauth2orize or fork it.)
    req.body.userIp = req.clientIp;
    req.body.userAgent = req.userAgent;
    next();
  },
  passport.authenticate(['clientBasic', 'clientPassword'], {session: false}),
  (req, res, next) => {
    // FIXME: we need to remove oauth2orize or fork it to prevent this hack.
    req.authInfo = Object.assign({}, req.authInfo, {
      req: req,
      res: res
    });
    next();
  },
  server.token(),
  server.errorHandler()
];

exports.generateToken = generateToken;
