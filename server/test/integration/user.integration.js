'use strict';

var bootstrap = require('../bootstrap.js');

var app = bootstrap.getApp();
var sqldb = bootstrap.getSqldb();
var User = sqldb.User;
var Client = sqldb.Client;
var request = require('supertest');

var assert = require('better-assert');

describe('User API:', function() {
  var user;

  // Clear users before testing
  before(function() {
    return User.destroy({ where: { email: 'test.integration@afrostream.tv' } }).then(function() {
      user = User.build({
        name: 'Fake User',
        email: 'test.integration@afrostream.tv',
        password: 'password'
      });
      return user.save();
    });
  });

  // Clear users after testing
  after(function() {
    return User.destroy({ where: { email: 'test.integration@afrostream.tv' } });
  });

  describe('GET /api/users/me', function() {
    var token;

    before(function(done) {
      request(app)
        .post('/auth/local')
        .send({
          email: 'test.integration@afrostream.tv',
          password: 'password'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          token = res.body.token;
          done(err);
        });
    });

    it('should respond with a user profile when authenticated', function(done) {
      request(app)
        .get('/api/users/me')
        .set('authorization', 'Bearer ' + token)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          assert(String(res.body._id) === String(user._id));
          done(err);
        });
    });

    it('should respond with a 401 when not authenticated', function(done) {
      request(app)
        .get('/api/users/me')
        .expect(401)
        .end(done);
    });
  });

  describe('POST /api/users/me', function () {
    before(function() {
      return User.destroy({ where: { $or: [
        { email: 'test.integration+bouygues_miami@afrostream.tv' },
        { email: 'test.integration+bouygues_miami2@afrostream.tv'}
      ]}});
    });

    var bouyguesMiamiClient = null;
    before(function() {
      return Client.find({ where: {type: 'legacy-api.bouygues-miami'}}).then(function (c) {
        assert(c, 'client bouygues doesnt exist in db, please seed.');
        bouyguesMiamiClient = c;
      });
    });

    var bouyguesMiamiClientToken = null;
    before(function () {
      // login client
      return bootstrap.getClientToken(app, bouyguesMiamiClient).then(function (t) {
        assert(t, 'missing client token');
        bouyguesMiamiClientToken = t;
      });
    });

    it('should create a random user using client bouygues', function (done) {
      request(app)
        .post('/api/users')
        .send({
          access_token: bouyguesMiamiClientToken,
          email: 'test.integration+bouygues_miami@afrostream.tv',
          password: 'password',
          bouyguesId: "abcdef"
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) return done(err);
          request(app)
            .get('/api/users/me')
            .set('Content-type', 'application/json')
            .set('Authorization', 'Bearer ' + res.body.token)
            .expect(200)
            .end(function (err, res) {
              assert(res.body.email === 'test.integration+bouygues_miami@afrostream.tv');
              done(err);
            });
        });
    });

    it('shouldnt be able to create a user without bouygues info', function (done) {
      request(app)
        .post('/api/users')
        .send({
          access_token: bouyguesMiamiClientToken,
          email: 'test.integration+bouygues_miami@afrostream.tv',
          password: 'password'
        }).expect(422)
        .end(function (err, res) {
          assert(res.body.error.indexOf('missing bouyguesId') !== -1);
          done(err);
        })
    });

    it('shouldnt be able to create a different user with an existing bouygues id', function (done) {
      request(app)
        .post('/api/users')
        .send({
          access_token: bouyguesMiamiClientToken,
          email: 'test.integration+bouygues_miami2@afrostream.tv',
          password: 'password',
          bouyguesId: "abcdef"
        }).expect(422)
        .end(function (err, res) {
          assert(res.body.error.indexOf('SequelizeUniqueConstraintError') !== -1);
          done(err);
        })
    });

    it('should be able to login with the bouygues id after creation', function (done) {
      request(app)
        .post('/auth/oauth2/token')
        .send({
          grant_type: 'bouygues',
          client_id: bouyguesMiamiClient.get('_id'),
          client_secret: bouyguesMiamiClient.get('secret'),
          id: "abcdef"
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          console.log(res.body);
          assert(typeof res.body.access_token === 'string');
          assert(typeof res.body.refresh_token === 'string');
          assert(typeof res.body.expires_in === 'number');
          assert(res.body.token_type === 'Bearer');
          done(err);
        });
    });
  });
});
