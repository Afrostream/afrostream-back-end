var oauth2orize = require('oauth2orize');
var passport = require('passport');
var crypto = require('crypto');
var utils = require('./utils');
var Client = require('../../sqldb').Client;
var AuthCode = require('../../sqldb').AuthCode;
var AccessToken = require('../../sqldb').AccessToken;
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

server.grant(oauth2orize.grant.code(function (client, redirectURI, user, ares, done) {
  AuthCode.create({clientId: client._id, redirectURI: redirectURI, userId: user._id})
    .then(function (entity) {
      done(null, entity.code);
    }).catch(function (err) {
      return done(err);
    });
}));

server.grant(oauth2orize.grant.token(function (client, user, ares, done) {
  var token = utils.uid(256);
  AccessToken.create({
    token: token,
    userID: user._id,
    clientID: client._id
  })
    .then(function (entity) {
      return done(null, entity.token);
    }).catch(function (err) {
      return done(err)
    });
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
        var token = utils.uid(256)
        AccessToken.create({
          token: token,
          userID: entity.userID,
          clientID: entity.clientID
        })
          .then(function (entity) {
            return done(null, entity.token);
          }).catch(function (err) {
            return done(err)
          });
      })
      .catch(function (err) {
        return done(err);
      });
  });
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

      var token = utils.uid(256);
      var tokenHash = crypto.createHash('sha1').update(token).digest('hex');
      var expiresIn = 1800;
      var expirationDate = new Date(new Date().getTime() + (expiresIn * 1000));
      AccessToken.create({
        token: tokenHash,
        clientId: entity._id,
        expirationDate: expirationDate
      })
        .then(function (tokenEntity) {
          return done(null, tokenEntity.token);
          console.log('tokenEntity', tokenEntity.secret);
        }).catch(function (err) {
          return done(err)
        });
      //var token = auth.signToken(entity._id, entity.role);
      //return done(null, token);
    })
    .catch(function (err) {
      return done(err);
    });
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

//exports.login = [
//  function (req, res, done) {
//    passport.authenticate('local', function (err, user, info) {
//      console.log(user._id)
//      done();
//    })
//  },
//  function (req, res, done) {
//    var user = req.user;
//    if (!user) {
//      return res.status(404).json({message: 'Something went wrong, please try again.'});
//    }
//
//    //var token = auth.signToken(user._id, user.role);
//    var token = utils.uid(256);
//    var tokenHash = crypto.createHash('sha1').update(token).digest('hex');
//    var expiresIn = 1800;
//    var expirationDate = new Date(new Date().getTime() + (expiresIn * 1000));
//    AccessToken.create({
//      token: tokenHash,
//      userId: user._id,
//      expirationDate: expirationDate
//    })
//      .then(function (tokenEntity) {
//        return done(null, tokenEntity.token);
//      }).catch(function (err) {
//        return done(err)
//      });
//
//  }
//];
