'use strict';

var passport = require('passport');
var BluebirdPromise = require('bluebird');
var LocalStrategy = require('passport-local').Strategy;
var BasicStrategy = require('passport-http').BasicStrategy;
var ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;
var BearerStrategy = require('passport-http-bearer').Strategy;

function localAuthenticate(User, email, password, done) {
  User.find({
    where: {
      email: {
        $iLike: email
      }
    }
  })
  .then(function (user) {
    if (!user) {
      throw new Error('This email is not registered');
    }
    var userAuthenticate = BluebirdPromise.promisify(user.authenticate.bind(user));
    return userAuthenticate(password)
      .then(function (authenticated) {
        if (!authenticated) {
          throw new Error('incorrect password');
        }
        return user;
      });
  })
  .then(function (user) {
    console.log('auth/oauth2/passeport.js#localAuthenticate OK');
    done(null, user);
  })
  .catch(function (err) {
    console.error('auth/oauth2/passeport.js#localAuthenticate ERROR', err);
    done(err);
  });
}

function clientAuthenticate(Client, clientId, clientSecret, done) {
  Client.find({
    where: {
      _id: clientId
    }
  })
  .then(function (client) {
    if (!client) {
      throw new Error('client not registered');
    }
    if (client.secret !== clientSecret) {
      throw new Error('incorrect secret');
    }
    return client;
  })
  .then(function (client) {
    console.log('auth/oauth2/passeport.js#clientAuthenticate OK');
    done(null, client);
  })
  .catch(function (err) {
    console.error('auth/oauth2/passeport.js#localAuthenticate ERROR', err);
    done(err);
  });
}

exports.setup = function (Client, User, AccessToken/*, config*/) {
  passport.serializeUser(function (user, done) {
    done(null, user._id);
  });

  passport.deserializeUser(function (id, done) {
    User.find({where: {_id: id}})
      .then(done.bind(null, null))
      .catch(done);
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
    }
  ));

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
          return done(null, false, { message: 'unknown token'});
        }
        if (new Date() > token.expirationDate) {
          return token.destroy()
            .then(function () {
              done(null, false, { message: 'token expired'});
            });
        }
        if (token.userId !== null) {
          return User.find({
            where: {
              _id: token.userId
            }
          })
            .then(function (entity) {
              if (!entity) return done(null, false, { message: 'unknown user'});
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
              if (!client) return done(null, false, { message: 'unknown client'});
              // no use of scopes for no
              var info = {scope: '*'};
              done(null, client, info);
            });
        }
      })
      .catch(done);
    }
  ));
};
