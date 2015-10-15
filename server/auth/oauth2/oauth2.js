var oauth2orize = require('oauth2orize');
var passport = require('passport');
var crypto = require('crypto');
var utils = require('./utils');
var config = require('../../config/environment');
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
  };
};

var generateToken = function (client, user, code, done) {
  var tokenData = generateTokenData(client, user, code);

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
      userId: tokenData.userId,
      expirationDate: tokenData.expirationDate,
      expirationTimespan: tokenData.expirationTimespan
    })
      .then(function (refreshTokenEntity) {
        return done(null, tokenEntity.token, refreshTokenEntity.token, {expires_in: tokenEntity.expirationTimespan});
      }).catch(function (err) {
        console.log('AccessToken refreshtoken error', err);
        return done(err);
      });
  }).catch(function (err) {
    console.error('AccessToken error: ', err);
    return done(err);
  });
};

var refreshToken = function (client, done) {
  var tokenData = generateTokenData(client, null, null);
  AccessToken.find({
    where: {
      clientId: client._id
    }
  })
    .then(function (tokenEntity) {
      return tokenEntity.updateAttributes({
        token: tokenData.token,
        expirationDate: tokenData.expirationDate,
        expirationTimespan: tokenData.expirationTimespan
      })
      .then(function (updated) {
        return done(null, updated.token, updated.token, {expires_in: updated.expirationTimespan});
      });
    }).catch(done);
};

server.grant(oauth2orize.grant.code(function (client, redirectURI, user, ares, done) {
  AuthCode.create({clientId: client._id, redirectURI: redirectURI, userId: user._id})
    .then(function (entity) {
      done(null, entity.code);
    }).catch(done);
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

    entity.destroy().
      then(function () {
        return generateToken(null, null, entity, done);
      })
      .catch(function (err) {
        return done(err);
      });
  });
}));


server.exchange(oauth2orize.exchange.password(function (client, username, password, scope, done) {
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
      return User.find({
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
            }
            return generateToken(entity, user, null, done);
          });
        });
    })
    .catch(done);
}));

server.exchange(oauth2orize.exchange.clientCredentials(function (client, scope, done) {
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
      return generateToken(entity, null, null, done);
    })
    .catch(done);
}));

server.exchange(oauth2orize.exchange.refreshToken(function (client, token, scope, done) {
  RefreshToken.find({
    where: {
      token: token
    }
  })
    .then(function (tokenRefresh) {
      if (!tokenRefresh) {
        return done(new Error('tokenRefresh not found'));
      }
      if (tokenRefresh.clientId !== client._id) {
        return done(new Error('clientId mismatch'));
      }
      return refreshToken(client, done);
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
  passport.authenticate(['clientBasic', 'clientPassword'], {session: true}),
  server.token(),
  server.errorHandler()
];

exports.login = [
  function (req, res, next) {
    passport.authenticate('local', function (err, user, info) {
      var error = err || info;
      if (error) {
        return res.status(401).json(error);
      }
      if (!user) {
        return res.status(404).json({message: 'Something went wrong, please try again.'});
      }

      return generateToken(null, user, null, function (err, token, refreshToken, info) {
        if (err) {
          return res.status(401).json(err);
        }
        return res.json({token: token, info: info});
      });

    })(req, res, next);
  }
];
