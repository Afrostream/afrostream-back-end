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
var Log = require('../../sqldb').Log;

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

var generateToken = function (client, user, code, userIp, userAgent) {
  var tokenData = generateTokenData(client, user, code);

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
  }).then(function () { }, function (err) { console.error(err); }); // can finish
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
        return [ tokenEntity.token, null, {expires_in: tokenEntity.expirationTimespan} ];
      }

      return RefreshToken.create({
          token: tokenData.refresh,
          clientId: tokenData.clientId,
          userId: tokenData.userId
        })
        .then(function (refreshTokenEntity) {
          return [ tokenEntity.token, refreshTokenEntity.token, {expires_in: tokenEntity.expirationTimespan} ];
        });
    })
    .then(
      function success(result) { return result; },
      function error(err) {
        console.error('[ERROR]: generateToken: ', err);
        throw err;
      }
    );
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

server.exchange(oauth2orize.exchange.password(function (client, username, password, scope, reqBody, done) {
  var c = {};

  Client.find({
      where: {
        _id: client._id
      }
    })
    .then(function (entity) {
      c.entity = entity;
      if (entity === null) {
        throw new TokenError('unknown client', 'invalid_grant');
      }
      if (entity.secret !== client.secret) {
        throw new TokenError('wrong secret', 'invalid_grant');
      }
      return User.find({
          where: {
            email: {
              $iLike: username
            }
          }
        });
    })
    .then(function (user) {
      c.user = user;
      if (user === null) {
        throw new TokenError('unknown user', 'invalid_grant');
      }
      if (entity.type === 'legacy-api.bouygues-miami' &&
          user.email.match(/@bbox\.fr$/i)) {
        return generateToken(c.entity, user, null, reqBody.userIp, reqBody.userAgent);
      }
      return Q.ninvoke(user, 'authenticate', password);
    })
    .then(function (authenticated) {
      if (!authenticated) {
        throw new TokenError('wrong password', 'invalid_grant');
      }
      return generateToken(c.entity, c.user, null, reqBody.userIp, reqBody.userAgent);
    })
    .nodeify(done, { spread: true });
}));

server.exchange(exchangeBouygues(function (client, id, scope, reqBody, done) {
  var c = {};

  Client.find({
    where: {
      _id: client._id
    }
  })
  .then(function (entity) {
      c.entity = entity;
      if (entity === null) {
        throw new TokenError('unknown client', 'invalid_grant');
      }
      if (entity.secret !== client.secret) {
        throw new TokenError('wrong secret', 'invalid_grant');
      }
      return User.find({
        where: {bouyguesId: id}
      });
    })
    .then(function (user) {
      if (user === null) {
        throw new TokenError('unknown bouyguesId', 'invalid_grant');
      }
      return generateToken(c.entity, user, null, reqBody.userIp, reqBody.userAgent);
    })
    .nodeify(done, { spread: true });
}));

server.exchange(exchangeIse2(function (client, id, scope, reqBody, done) {
  var c = {};

  Client.find({
    where: {
      _id: client._id
    }
  })
    .then(function (entity) {
      c.entity = entity;
      if (entity === null) {
        throw new TokenError('unknown client', 'invalid_grant');
      }
      if (entity.secret !== client.secret) {
        throw new TokenError('wrong secret', 'invalid_grant');
      }
      return User.find({
        where: {ise2: id}
      });
    })
    .then(function (user) {
      c.user = user;
      if (user === null) {
        throw new TokenError('UNKNOWN_ISE2:' + id, 'invalid_grant');
      }
      return generateToken(c.entity, user, null, reqBody.userIp, reqBody.userAgent);
    })
    .nodeify(done, { spread: true });
}));

server.exchange(oauth2orize.exchange.clientCredentials(function (client, scope, reqBody, done) {
  Client.find({
      where: {
        _id: client._id
      }
    })
    .then(function (entity) {
      if (entity === null) {
        throw new TokenError('unknown client', 'invalid_grant');
      }
      if (entity.secret !== client.secret) {
        throw new TokenError('wrong secret', 'invalid_grant');
      }
      return generateToken(entity, null, null, reqBody.userIp, reqBody.userAgent);
    })
    .nodeify(done, { spread: true });
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
      return [ accessToken.token, refreshTokenToken, {expires_in: accessToken.expirationTimespan} ];
    })
    .nodeify(done, { spread: true });
}));

exports.authorization = [
  server.authorization(function (clientID, redirectURI, done) {
    Client.find({
        where: {
          _id: clientID
        }
      })
      .then(function (client) {
        return [ client, redirectURI ];
      })
      .nodeify(done, { spread: true });
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
