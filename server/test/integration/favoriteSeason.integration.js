'use strict';

var bootstrap = require('../bootstrap.js');

var request = require('supertest');

var assert = require('better-assert');

describe('API: /user/:id/favoritesSeasons', function() {
  var user, token;
  var app = bootstrap.getApp();

  //
  // SETUP
  //
  before(function () {
    return bootstrap.getTestUser().then(function (u) { user = u; });
  });

  // Clear users favorite seasons before testing
  before(function () {
    var db = bootstrap.getSqldb();
    return db.UsersFavoritesSeasons.destroy({ where: { userId: user._id } });
  });

  before(function () {
    return bootstrap.getToken(app, user).then(function (t) {
      token = t;
    })
  });

  // Clear users favorite seasons after testing
  after(function () {
    var db = bootstrap.getSqldb();
    return db.UsersFavoritesSeasons.destroy({ where: { userId: user._id } });
  });

  describe('GET /user/:id/favoritesSeasons', function() {
    it('should respond 200 OK with no favorites', function(done) {
      request(app)
        .get('/api/users/'+user._id+'/favoritesSeasons/')
        .set('authorization', 'Bearer ' + token)
        .expect('Content-Type', /json/)
        .expect(function (res) {
          assert(Array.isArray(res.body) && res.body.length === 0);
        })
        .expect(200, done);
    });
  });

  describe('POST /user/:id/favoritesSeasons {seasonId: ...}', function() {
    var randomSeason;
    before(function () {
      return bootstrap.getRandomSeason().then(function (m) { randomSeason = m; });
    });

    it('should respond 200 OK with a season as a result', function(done) {
      request(app)
        .post('/api/users/'+user._id+'/favoritesSeasons/')
        .set('authorization', 'Bearer ' + token)
        .send(randomSeason)
        .expect('Content-Type', /json/)
        .expect(function (res) {
          assert(res.body._id === randomSeason._id);
          assert(res.body.title === randomSeason.title);
        })
        .expect(200, done);
    });

    it('then, GET /user/:id/favoritesSeasons should respond 200 OK with 1 favorites on second hit', function(done) {
      request(app)
        .get('/api/users/'+user._id+'/favoritesSeasons/')
        .set('authorization', 'Bearer ' + token)
        .expect('Content-Type', /json/)
        .expect(function (res) {
          assert(Array.isArray(res.body) && res.body.length === 1);
          assert(res.body[0]._id === randomSeason._id);
          assert(res.body[0].title === randomSeason.title);
        })
        .expect(200, done);
    });

    it('then, DELETE /user/:id/favoritesSeasons/:seasonId should respond 200 OK', function(done) {
      request(app)
        .del('/api/users/'+user._id+'/favoritesSeasons/'+randomSeason._id)
        .set('authorization', 'Bearer ' + token)
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('then, it should respond 200 OK with no favorites', function(done) {
      request(app)
        .get('/api/users/'+user._id+'/favoritesSeasons/')
        .set('authorization', 'Bearer ' + token)
        .expect('Content-Type', /json/)
        .expect(function (res) {
          assert(Array.isArray(res.body) && res.body.length === 0);
        })
        .expect(200, done);
    });
  });

  describe('POST /user/me/favoritesSeasons {seasonId: ...}', function() {
    var randomSeason;

    before(function () {
      return bootstrap.getRandomSeason().then(function (m) { randomSeason = m; });
    });

    it('should respond 200 OK with a season as a result', function(done) {
      request(app)
        .post('/api/users/me/favoritesSeasons/')
        .set('authorization', 'Bearer ' + token)
        .send(randomSeason)
        .expect('Content-Type', /json/)
        .expect(function (res) {
          assert(res.body._id === randomSeason._id);
          assert(res.body.title === randomSeason.title);
        })
        .expect(200, done);
    });

    it('then, GET /user/me/favoritesSeasons should respond 200 OK with 1 favorites on second hit', function(done) {
      request(app)
        .get('/api/users/me/favoritesSeasons/')
        .set('authorization', 'Bearer ' + token)
        .expect('Content-Type', /json/)
        .expect(function (res) {
          assert(Array.isArray(res.body) && res.body.length === 1);
          assert(res.body[0]._id === randomSeason._id);
          assert(res.body[0].title === randomSeason.title);
        })
        .expect(200, done);
    });

    it('then, GET /user/:id/favoritesSeasons should respond 200 OK with 1 favorites on second hit', function(done) {
      request(app)
        .get('/api/users/'+user._id+'/favoritesSeasons/')
        .set('authorization', 'Bearer ' + token)
        .expect('Content-Type', /json/)
        .expect(function (res) {
          assert(Array.isArray(res.body) && res.body.length === 1);
          assert(res.body[0]._id === randomSeason._id);
          assert(res.body[0].title === randomSeason.title);
        })
        .expect(200, done);
    });

    it('then, DELETE /user/me/favoritesSeasons/:seasonId should respond 200 OK', function(done) {
      request(app)
        .del('/api/users/me/favoritesSeasons/'+randomSeason._id)
        .set('authorization', 'Bearer ' + token)
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('then, it should respond 200 OK with no favorites', function(done) {
      request(app)
        .get('/api/users/me/favoritesSeasons/')
        .set('authorization', 'Bearer ' + token)
        .expect('Content-Type', /json/)
        .expect(function (res) {
          assert(Array.isArray(res.body) && res.body.length === 0);
        })
        .expect(200, done);
    });

    it('then, it should respond 200 OK with no favorites', function(done) {
      request(app)
        .get('/api/users/'+user._id+'/favoritesSeasons/')
        .set('authorization', 'Bearer ' + token)
        .expect('Content-Type', /json/)
        .expect(function (res) {
          assert(Array.isArray(res.body) && res.body.length === 0);
        })
        .expect(200, done);
    });
  });

  describe('POST /user/:id/favoritesSeasons {seasonId: ...} without token', function() {
    var randomSeason;
    before(function () {
      return bootstrap.getRandomSeason().then(function (m) { randomSeason = m; });
    });

    it('should respond 401', function(done) {
      request(app)
        .post('/api/users/'+user._id+'/favoritesSeasons/')
        .send(randomSeason)
        .expect(401, done);
    });
  });

  describe('POST /user/:id/favoritesSeasons {seasonId: ...} of unexistant season', function() {
    it('should respond 500 unknown season', function(done) {
      request(app)
        .post('/api/users/'+user._id+'/favoritesSeasons/')
        .set('authorization', 'Bearer ' + token)
        .send({_id:31415926}) // unexistant season
        .expect(500, /unknown season/, done);
    });
  });

  describe('POST /user/:id/favoritesSeasons {seasonId: ...} of inactive season', function() {
    var randomSeason;
    before(function () {
      return bootstrap.getRandomInactiveSeason().then(function (m) { randomSeason = m; });
    });

    it('should respond 200 OK with a season as a result', function(done) {
      request(app)
        .post('/api/users/'+user._id+'/favoritesSeasons/')
        .set('authorization', 'Bearer ' + token)
        .send(randomSeason)
        .expect(500, done);
    });
  });

  describe('GET /user/:id/favoritesSeasons after a season was inactivated', function() {

    before(function () {
      // remove all linked seasons
      var db = bootstrap.getSqldb();
      return db.UsersFavoritesSeasons.destroy({ where: { userId: user._id } });
    });

    before(function () {
      // add inactive season to the user favorites (hardcoded)
      return bootstrap.getRandomInactiveSeason().then(function (randomSeason) {
        return user.addFavoritesSeasons(randomSeason);
      });
    });

    it('should respond 200 OK with no favorites', function(done) {
      request(app)
        .get('/api/users/'+user._id+'/favoritesSeasons/')
        .set('authorization', 'Bearer ' + token)
        .expect('Content-Type', /json/)
        .expect(function (res) {
          assert(Array.isArray(res.body) && res.body.length === 0);
        })
        .expect(200, done);
    });
  });
});
