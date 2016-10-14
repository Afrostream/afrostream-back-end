'use strict';

var bootstrap = require('../bootstrap.js');

var app = bootstrap.getApp();
var sqldb = bootstrap.getSqldb();
var User = sqldb.User;
var Video = sqldb.Video;
var request = require('supertest');

var assert = require('better-assert');

describe('Right API:', function() {
  var user, token, video;

  // Clear users & create single one before testing
  before(function() {
    return User.destroy({ where: { email: 'test.integration+right@afrostream.tv' } }).then(function() {
      user = User.build({
        name: 'Fake User',
        email: 'test.integration+right@afrostream.tv',
        password: 'password'
      });
      return user.save();
    });
  });

  // log the user
  before(function(done) {
    request(app)
      .post('/auth/local')
      .send({
        email: 'test.integration+right@afrostream.tv',
        password: 'password'
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        token = res.body.token;
        if (!token) {
          throw "missing token";
        }
        done(err);
      });
  });

  var user2, token2;

  // create a second user
  before(function() {
    return User.destroy({ where: { email: 'test.integration+right2@afrostream.tv' } }).then(function() {
      user2 = User.build({
        name: 'Fake User',
        email: 'test.integration+right2@afrostream.tv',
        password: 'password'
      });
      return user2.save();
    });
  });

  // log the user
  before(function(done) {
    request(app)
      .post('/auth/local')
      .send({
        email: 'test.integration+right2@afrostream.tv',
        password: 'password'
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        token2 = res.body.token;
        if (!token2) {
          throw "missing token";
        }
        done(err);
      });
  });

  // search a video with DRM
  before(function() {
    return Video.findOne({where: { drm: true }}).then(function (v) {
      if (!v) throw "missing video with DRM for the tests";
      video = v;
    });
  });

  // Clear users after testing
  after(function() {
    return User.destroy({ where: { email: 'test.integration+right@afrostream.tv' } });
  });
  after(function() {
    return User.destroy({ where: { email: 'test.integration+right2@afrostream.tv' } });
  });

  // the user
  describe('GET /right/user/:id/asset/:assetId?variantId=[variantId]&sessionId=[sessionId]&clientId=[clientId]', function() {
    describe('with correct params (existing user, great token, ...)', function() {
      it('should respond with a 200 OK & granted', function (done) {
        request(app)
          .get('/right/user/'+user._id+'/asset/'+video.encodingId)
          .query({variantId: 'variant', sessionId: token})
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            assert(String(res.body.message) === 'granted');
            done(err);
          });
      });
    });

    describe('with missing sessionId', function() {
      it('should respond with a 200 OK & not granted', function (done) {
        request(app)
          .get('/right/user/'+user._id+'/asset/'+video.encodingId)
          .query({variantId: 'variant', sessionId: '42424245'})
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            assert(String(res.body.message) === 'not granted');
            done(err);
          });
      });
    });

    describe('with userId != token userId', function() {
      it('should respond with a 200 OK & not granted', function (done) {
        request(app)
          .get('/right/user/'+user2._id+'/asset/'+video.encodingId)
          .query({variantId: 'variant', sessionId: token})
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            assert(String(res.body.message) === 'not granted');
            done(err);
          });
      });
    });

    describe('with wrong asset', function() {
      it('should respond with a 200 OK & not granted', function (done) {
        request(app)
          .get('/right/user/'+user._id+'/asset/0000')
          .query({variantId: 'variant', sessionId: token})
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            assert(String(res.body.message) === 'not granted');
            done(err);
          });
      });
    });
  });
});
