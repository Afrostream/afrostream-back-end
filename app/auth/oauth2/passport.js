var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var BasicStrategy = require('passport-http').BasicStrategy;
var ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;
var BearerStrategy = require('passport-http-bearer').Strategy;

var logger = rootRequire('logger').prefix('AUTH').prefix('OAUTH2');

function localAuthenticate (User, email, password, done) {
  User.find({
    where: {
      email: email.toLowerCase()
    }
  })
    .then(function (user) {
      if (!user) {
        return done(null, false, {
          message: 'This email is not registered.'
        });
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
          return done(null, user);
        }
      });
    })
    .catch(function (err) {
      return done(err);
    });
}

function clientAuthenticate (Client, clientId, clientSecret, done) {
  Client.find({
    where: {
      _id: clientId
    }
  })
    .then(function (client) {
      if (!client) {
        return done(null, false, {
          message: 'This client is not registered.'
        });
      }
      if (client.secret !== clientSecret) {
        return done(null, false, {
          message: 'This secret is not correct.'
        });
      }
      return done(null, client);
    })
    .catch(function (err) {
      return done(err);
    });
}

exports.setup = function (Client, User, AccessToken, config) {
  passport.serializeUser(function (user, done) {
    done(null, user._id);
  });

  passport.deserializeUser(function (id, done) {
    User.find({where: {_id: id}})
      .then(function (user) {
        done(null, user);
      })
      .catch(function (err) {
        done(err);
      });
  });
  /**
   * LocalStrategy
   *
   * This strategy is used to authenticate users based on a username and password.
   * Anytime a request is made to authorize an application, we must ensure that
   * a user is logged in before asking them to approve the request.
   */
  passport.use('local', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password' // this is the virtual field on the model
  }, function (email, password, done) {
    return localAuthenticate(User, email, password, done);
  }));
  /**
   * BasicStrategy & ClientPasswordStrategy
   *
   * These strategies are used to authenticate registered OAuth clients.  They are
   * employed to protect the `token` endpoint, which consumers use to obtain
   * access tokens.  The OAuth 2.0 specification suggests that clients use the
   * HTTP Basic scheme to authenticate.  Use of the client password strategy
   * allows clients to send the same credentials in the request body (as opposed
   * to the `Authorization` header).  While this approach is not recommended by
   * the specification, in practice it is quite common.
   */
  passport.use('clientBasic', new BasicStrategy(
    function (clientId, clientSecret, done) {
      return clientAuthenticate(Client, clientId, clientSecret, done);
    }
  ));
  passport.use('clientPassword', new ClientPasswordStrategy(
    function (clientId, clientSecret, done) {
      return clientAuthenticate(Client, clientId, clientSecret, done);
    }));

  /**
   * BearerStrategy
   *
   * This strategy is used to authenticate either users or clients based on an access token
   * (aka a bearer token).  If a user, they must have previously authorized a client
   * application, which is issued an access token to make requests on behalf of
   * the authorizing user.
   */
  passport.use('bearer', new BearerStrategy(
    function (accessToken, done) {
      AccessToken.find({
        where: {
          token: accessToken
        }
      })
        .then(function (token) {
          if (!token) {
            logger.error('passport: bearer: cannot find token ' + accessToken);
            return done(null, false);
          }
          if (new Date() > token.expirationDate) {
            return token.destroy()
              .then(function () {
                logger.error('passport: bearer: token expired ' + accessToken);
                done(new Error('token expired'))
              });
          }
          if (token.userId !== null) {
            return User.find({
              where: {
                _id: token.userId
              }
            })
              .then(function (entity) {
                if (!entity) {
                  logger.error('passport: bearer: cannot find user ' + token.userId);
                  return done(null, false);
                }
                // no use of scopes for no
                var info = {scope: '*'};
                done(null, entity, info);
              });
          } else {
            return Client.find({
              where: {
                _id: token.clientId
              }
            })
              .then(function (client) {
                if (!client) {
                  logger.error('passport: bearer: cannot find client ' + token.clientId);
                  return done(null, false);
                }
                // no use of scopes for no
                var info = {scope: '*'};
                done(null, client, info);
              });
          }
        })
        .catch(function (err) {
          logger.error('passport: bearer: unknownerror ' + err, err);
          return done(err);
        });
    }
  ))
};
