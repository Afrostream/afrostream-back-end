'use strict';

var bootstrap = require('../bootstrap.js');

var app = bootstrap.getApp();
var sqldb = bootstrap.getSqldb();
var User = sqldb.User;

var request = require('supertest');

var assert = require('better-assert');

describe('User API:', function () {
  var user;

  var movie;

  // Clear users before testing
  before(function () {
    return User.destroy({ where: { email: 'test.oauth2@afrostream.tv' } }).then(function () {
      user = User.build({
        name: 'Fake User',
        email: 'test.oauth2@afrostream.tv',
        password: 'password'
      });
      return user.save();
    });
  });

  before(function () {
    return bootstrap.getRandomMovie().then(function (m) { movie = m; });
  });

  // Clear users after testing
  after(function () {
    return User.destroy({ where: { email: 'test.oauth2@afrostream.tv' } });
  });

  describe('POST /auth/local (2 leg auth)', function () {
    var token;

    it('should give a working token with correct expires_in', function (done) {
      request(app)
        .post('/auth/local')
        .send({
          email: 'test.oauth2@afrostream.tv',
          password: 'password'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          assert(typeof res.body.token === 'string');
          assert(res.body && typeof res.body.expires_in === 'number');
          token = res.body.token;
          done();
        });
    });

    it('should give a working access_token', function (done) {
      request(app)
        .get('/api/movies/'+movie._id)
        .set('Authorization', 'Bearer '+token)
        .expect(200, function (err, res) {
          assert(res.body.title === movie.get('title'));
          done();
        });
    });
  });

  describe('POST /auth/oauth2/token (3 leg auth)', function () {
    var client;

    before(function () {
      return bootstrap.getTestClient().then(function (c) { client = c; });
    });

    before(function() {
      return User.destroy({ where: { email: 'test.integration+oauth2_bouygues@afrostream.tv' } }).then(function () {
        user = User.build({
          name: 'Fake User',
          email: 'test.integration+oauth2_bouygues@afrostream.tv',
          password: 'password',
          bouyguesId: "toto42"
        });
        return user.save();
      });
    });

    // Clear users after testing
    after(function() {
      return User.destroy({ where: { email: 'test.integration+oauth2_bouygues@afrostream.tv' } });
    });

    describe('using grant_type password', function () {
      var access_token, refresh_token;

      it('should answer 200OK with token & refresh token', function (done) {
        request(app)
          .post('/auth/oauth2/token')
          .send({
            grant_type: 'password',
            client_id: client.get('_id'),
            client_secret: client.get('secret'),
            username: 'test.oauth2@afrostream.tv',
            password: 'password'
          })
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            assert(typeof res.body.access_token === 'string');
            assert(typeof res.body.refresh_token === 'string');
            assert(typeof res.body.expires_in === 'number');
            assert(res.body.token_type === 'Bearer');
            access_token = res.body.access_token;
            refresh_token = res.body.refresh_token;
            done(err);
          });
      });

      it('should give a working access_token', function (done) {
        request(app)
          .get('/api/movies/' + movie._id)
          .set('Authorization', 'Bearer ' + access_token)
          .expect(200, done);
      });

      it('should give a working refresh_token', function (done) {
        request(app)
          .post('/auth/oauth2/token')
          .send({
            grant_type: 'refresh_token',
            client_id: client.get('_id'),
            client_secret: client.get('secret'),
            refresh_token: refresh_token
          })
          .expect('Content-Type', /json/)
          .expect(200, done);
      });
    });

    describe('using grant type bouygues', function () {
      var access_token, refresh_token;

      it('should answer 200OK with token & refresh token', function (done) {
        request(app)
          .post('/auth/oauth2/token')
          .send({
            grant_type: 'bouygues',
            client_id: client.get('_id'),
            client_secret: client.get('secret'),
            id: 'toto42'
          })
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            assert(typeof res.body.access_token === 'string');
            assert(typeof res.body.refresh_token === 'string');
            assert(typeof res.body.expires_in === 'number');
            assert(res.body.token_type === 'Bearer');
            access_token = res.body.access_token;
            refresh_token = res.body.refresh_token;
            done(err);
          });
      });

      it('should give a working access_token', function (done) {
        request(app)
          .get('/api/movies/' + movie._id)
          .set('Authorization', 'Bearer ' + access_token)
          .expect(200, done);
      });

      it('should give a working refresh_token', function (done) {
        request(app)
          .post('/auth/oauth2/token')
          .send({
            grant_type: 'refresh_token',
            client_id: client.get('_id'),
            client_secret: client.get('secret'),
            refresh_token: refresh_token
          })
          .expect('Content-Type', /json/)
          .expect(200, done);
      });

      it('should answer 403 when using an unexisting id', function (done) {
        request(app)
          .post('/auth/oauth2/token')
          .send({
            grant_type: 'bouygues',
            client_id: client.get('_id'),
            client_secret: client.get('secret'),
            id: 'iuzehfoazinfhcoziuefheconia'
          })
          .expect(403)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            console.log(res.body)
            done(err);
          });
      });
    });
  });
});
