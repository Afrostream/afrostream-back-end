'use strict';

var bootstrap = require('../../../../tests/bootstrap.js');

var request = require('supertest');

var assert = require('better-assert');

describe('API: /user/:id/favoritesEpisodes', function() {
  var user, token;
  var app = bootstrap.getApp();

  //
  // SETUP
  //
  before(function () {
    return bootstrap.getTestUser().then(function (u) { user = u; });
  });

  // Clear users favorite episodes before testing
  before(function () {
    var db = bootstrap.getSqldb();
    return db.UsersFavoritesEpisodes.destroy({ where: { userId: user._id } });
  });

  before(function () {
    return bootstrap.getToken(app, user).then(function (t) {
      token = t;
    })
  });

  // Clear users favorite episodes after testing
  after(function () {
    var db = bootstrap.getSqldb();
    return db.UsersFavoritesEpisodes.destroy({ where: { userId: user._id } });
  });

  describe('GET /user/:id/favoritesEpisodes', function() {
    it('should respond 200 OK with no favorites', function(done) {
      request(app)
        .get('/api/users/'+user._id+'/favoritesEpisodes/')
        .set('authorization', 'Bearer ' + token)
        .expect('Content-Type', /json/)
        .expect(function (res) {
          assert(Array.isArray(res.body) && res.body.length === 0);
        })
        .expect(200, done);
    });
  });

  describe('POST /user/:id/favoritesEpisodes {episodeId: ...}', function() {
    var randomEpisode;

    before(function () {
      return bootstrap.getRandomEpisode().then(function (m) { randomEpisode = m; });
    });

    it('should respond 200 OK with a episode as a result', function(done) {
      request(app)
        .post('/api/users/'+user._id+'/favoritesEpisodes/')
        .set('authorization', 'Bearer ' + token)
        .send(randomEpisode)
        .expect('Content-Type', /json/)
        .expect(function (res) {
          assert(res.body._id === randomEpisode._id);
          assert(res.body.title === randomEpisode.title);
        })
        .expect(200, done);
    });

    it('then, GET /user/:id/favoritesEpisodes should respond 200 OK with 1 favorites on second hit', function(done) {
      request(app)
        .get('/api/users/'+user._id+'/favoritesEpisodes/')
        .set('authorization', 'Bearer ' + token)
        .expect('Content-Type', /json/)
        .expect(function (res) {
          assert(Array.isArray(res.body) && res.body.length === 1);
          assert(res.body[0]._id === randomEpisode._id);
          assert(res.body[0].title === randomEpisode.title);
        })
        .expect(200, done);
    });

    it('then, DELETE /user/:id/favoritesEpisodes/:episodeId should respond 200 OK', function(done) {
      request(app)
        .del('/api/users/'+user._id+'/favoritesEpisodes/'+randomEpisode._id)
        .set('authorization', 'Bearer ' + token)
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('then, it should respond 200 OK with no favorites', function(done) {
      request(app)
        .get('/api/users/'+user._id+'/favoritesEpisodes/')
        .set('authorization', 'Bearer ' + token)
        .expect('Content-Type', /json/)
        .expect(function (res) {
          assert(Array.isArray(res.body) && res.body.length === 0);
        })
        .expect(200, done);
    });
  });

  describe('POST /user/me/favoritesEpisodes {episodeId: ...}', function() {
    var randomEpisode;

    before(function () {
      return bootstrap.getRandomEpisode().then(function (m) { randomEpisode = m; });
    });

    it('should respond 200 OK with a episode as a result', function(done) {
      request(app)
        .post('/api/users/me/favoritesEpisodes/')
        .set('authorization', 'Bearer ' + token)
        .send(randomEpisode)
        .expect('Content-Type', /json/)
        .expect(function (res) {
          assert(res.body._id === randomEpisode._id);
          assert(res.body.title === randomEpisode.title);
        })
        .expect(200, done);
    });

    it('then, GET /user/me/favoritesEpisodes should respond 200 OK with 1 favorites on second hit', function(done) {
      request(app)
        .get('/api/users/me/favoritesEpisodes/')
        .set('authorization', 'Bearer ' + token)
        .expect('Content-Type', /json/)
        .expect(function (res) {
          assert(Array.isArray(res.body) && res.body.length === 1);
          assert(res.body[0]._id === randomEpisode._id);
          assert(res.body[0].title === randomEpisode.title);
        })
        .expect(200, done);
    });

    it('then, GET /user/:id/favoritesEpisodes should respond 200 OK with 1 favorites on second hit', function(done) {
      request(app)
        .get('/api/users/'+user._id+'/favoritesEpisodes/')
        .set('authorization', 'Bearer ' + token)
        .expect('Content-Type', /json/)
        .expect(function (res) {
          assert(Array.isArray(res.body) && res.body.length === 1);
          assert(res.body[0]._id === randomEpisode._id);
          assert(res.body[0].title === randomEpisode.title);
        })
        .expect(200, done);
    });

    it('then, DELETE /user/me/favoritesEpisodes/:episodeId should respond 200 OK', function(done) {
      request(app)
        .del('/api/users/me/favoritesEpisodes/'+randomEpisode._id)
        .set('authorization', 'Bearer ' + token)
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('then, it should respond 200 OK with no favorites', function(done) {
      request(app)
        .get('/api/users/me/favoritesEpisodes/')
        .set('authorization', 'Bearer ' + token)
        .expect('Content-Type', /json/)
        .expect(function (res) {
          assert(Array.isArray(res.body) && res.body.length === 0);
        })
        .expect(200, done);
    });

    it('then, it should respond 200 OK with no favorites', function(done) {
      request(app)
        .get('/api/users/'+user._id+'/favoritesEpisodes/')
        .set('authorization', 'Bearer ' + token)
        .expect('Content-Type', /json/)
        .expect(function (res) {
          assert(Array.isArray(res.body) && res.body.length === 0);
        })
        .expect(200, done);
    });
  });

  describe('POST /user/:id/favoritesEpisodes {episodeId: ...} without token', function() {
    var randomEpisode;

    before(function () {
      return bootstrap.getRandomEpisode().then(function (m) { randomEpisode = m; });
    });

    it('should respond 401', function(done) {
      request(app)
        .post('/api/users/'+user._id+'/favoritesEpisodes/')
        .send(randomEpisode)
        .expect(401, done);
    });
  });

  describe('POST /user/:id/favoritesEpisodes {episodeId: ...} of unexistant episode', function() {
    it('should respond 500 unknown episode', function(done) {
      request(app)
        .post('/api/users/'+user._id+'/favoritesEpisodes/')
        .set('authorization', 'Bearer ' + token)
        .send({_id:31415926}) // unexistant episode
        .expect(500, /unknown episode/, done);
    });
  });

  describe('POST /user/:id/favoritesEpisodes {episodeId: ...} of inactive episode', function() {
    var randomEpisode;

    before(function () {
      return bootstrap.getRandomInactiveEpisode().then(function (m) { randomEpisode = m; });
    });

    it('should respond 200 OK with a episode as a result', function(done) {
      request(app)
        .post('/api/users/'+user._id+'/favoritesEpisodes/')
        .set('authorization', 'Bearer ' + token)
        .send(randomEpisode)
        .expect(500, done);
    });
  });

  describe('GET /user/:id/favoritesEpisodes after a episode was inactivated', function() {
    before(function () {
      // remove all linked episodes
      var db = bootstrap.getSqldb();
      return db.UsersFavoritesEpisodes.destroy({ where: { userId: user._id } });
    });

    before(function () {
      // add inactive episode to the user favorites (hardcoded)
      return bootstrap.getRandomInactiveEpisode().then(function (randomEpisode) {
        return user.addFavoritesEpisodes(randomEpisode);
      });
    });

    it('should respond 200 OK with no favorites', function(done) {
      request(app)
        .get('/api/users/'+user._id+'/favoritesEpisodes/')
        .set('authorization', 'Bearer ' + token)
        .expect('Content-Type', /json/)
        .expect(function (res) {
          assert(Array.isArray(res.body) && res.body.length === 0);
        })
        .expect(200, done);
    });
  });
});
