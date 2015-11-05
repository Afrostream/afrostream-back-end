'use strict';

var bootstrap = require('../../../../tests/bootstrap.js');

var request = require('supertest');

var assert = require('better-assert');

describe('API: /user/:id/favoritesMovies', function() {
  var user, token;
  var app = bootstrap.getApp();

  //
  // SETUP
  //
  before(function () {
    return bootstrap.getTestUser().then(function (u) { user = u; });
  });

  // Clear users favorite movies before testing
  before(function () {
    var db = bootstrap.getSqldb();
    return db.UsersFavoritesMovies.destroy({ where: { userId: user._id } });
  });

  before(function () {
    return bootstrap.getToken(app, user).then(function (t) {
      token = t;
    })
  });

  // Clear users favorite movies after testing
  after(function () {
    var db = bootstrap.getSqldb();
    return db.UsersFavoritesMovies.destroy({ where: { userId: user._id } });
  });

  describe('GET /user/:id/favoritesMovies', function() {
    it('should respond 200 OK with no favorites', function(done) {
      request(app)
        .get('/api/users/'+user._id+'/favoritesMovies/')
        .set('authorization', 'Bearer ' + token)
        .expect('Content-Type', /json/)
        .expect(function (res) {
          assert(Array.isArray(res.body) && res.body.length === 0);
        })
        .expect(200, done);
    });
  });

  describe('GET /user/me/favoritesMovies', function() {
    it('should respond 200 OK with no favorites', function(done) {
      request(app)
        .get('/api/users/me/favoritesMovies/')
        .set('authorization', 'Bearer ' + token)
        .expect('Content-Type', /json/)
        .expect(function (res) {
          assert(Array.isArray(res.body) && res.body.length === 0);
        })
        .expect(200, done);
    });
  });

  describe('POST /user/:id/favoritesMovies {movieId: ...}', function() {
    var randomMovie;
    before(function () {
      return bootstrap.getRandomMovie().then(function (m) { randomMovie = m; });
    });

    it('should respond 200 OK with a movie as a result', function(done) {
      request(app)
        .post('/api/users/'+user._id+'/favoritesMovies/')
        .set('authorization', 'Bearer ' + token)
        .send(randomMovie)
        .expect('Content-Type', /json/)
        .expect(function (res) {
          assert(res.body._id === randomMovie._id);
          assert(res.body.title === randomMovie.title);
        })
        .expect(200, done);
    });

    it('then, GET /user/:id/favoritesMovies should respond 200 OK with 1 favorites', function(done) {
      request(app)
        .get('/api/users/'+user._id+'/favoritesMovies/')
        .set('authorization', 'Bearer ' + token)
        .expect('Content-Type', /json/)
        .expect(function (res) {
          assert(Array.isArray(res.body) && res.body.length === 1);
          assert(res.body[0]._id === randomMovie._id);
          assert(res.body[0].title === randomMovie.title);
        })
        .expect(200, done);
    });

    it('then, DELETE /user/:id/favoritesMovies/:movieId should respond 200 OK', function(done) {
      request(app)
        .del('/api/users/'+user._id+'/favoritesMovies/'+randomMovie._id)
        .set('authorization', 'Bearer ' + token)
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('then, it should respond 200 OK with no favorites', function(done) {
      request(app)
        .get('/api/users/'+user._id+'/favoritesMovies/')
        .set('authorization', 'Bearer ' + token)
        .expect('Content-Type', /json/)
        .expect(function (res) {
          assert(Array.isArray(res.body) && res.body.length === 0);
        })
        .expect(200, done);
    });
  });

  describe('POST /user/me/favoritesMovies {movieId: ...}', function() {
    var randomMovie;

    before(function () {
      return bootstrap.getRandomMovie().then(function (m) { randomMovie = m; });
    });

    it('should respond 200 OK with a movie as a result', function(done) {
      request(app)
        .post('/api/users/me/favoritesMovies/')
        .set('authorization', 'Bearer ' + token)
        .send(randomMovie)
        .expect('Content-Type', /json/)
        .expect(function (res) {
          assert(res.body._id === randomMovie._id);
          assert(res.body.title === randomMovie.title);
        })
        .expect(200, done);
    });

    it('then, GET /user/me/favoritesMovies should respond 200 OK with 1 favorites on second hit', function(done) {
      request(app)
        .get('/api/users/me/favoritesMovies/')
        .set('authorization', 'Bearer ' + token)
        .expect('Content-Type', /json/)
        .expect(function (res) {
          assert(Array.isArray(res.body) && res.body.length === 1);
          assert(res.body[0]._id === randomMovie._id);
          assert(res.body[0].title === randomMovie.title);
        })
        .expect(200, done);
    });

    it('then, GET /user/:id/favoritesMovies should respond 200 OK with 1 favorites on second hit', function(done) {
      request(app)
        .get('/api/users/'+user._id+'/favoritesMovies/')
        .set('authorization', 'Bearer ' + token)
        .expect('Content-Type', /json/)
        .expect(function (res) {
          assert(Array.isArray(res.body) && res.body.length === 1);
          assert(res.body[0]._id === randomMovie._id);
          assert(res.body[0].title === randomMovie.title);
        })
        .expect(200, done);
    });

    it('then, DELETE /user/me/favoritesMovies/:movieId should respond 200 OK', function(done) {
      request(app)
        .del('/api/users/me/favoritesMovies/'+randomMovie._id)
        .set('authorization', 'Bearer ' + token)
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('then, it should respond 200 OK with no favorites', function(done) {
      request(app)
        .get('/api/users/me/favoritesMovies/')
        .set('authorization', 'Bearer ' + token)
        .expect('Content-Type', /json/)
        .expect(function (res) {
          assert(Array.isArray(res.body) && res.body.length === 0);
        })
        .expect(200, done);
    });

    it('then, it should respond 200 OK with no favorites', function(done) {
      request(app)
        .get('/api/users/'+user._id+'/favoritesMovies/')
        .set('authorization', 'Bearer ' + token)
        .expect('Content-Type', /json/)
        .expect(function (res) {
          assert(Array.isArray(res.body) && res.body.length === 0);
        })
        .expect(200, done);
    });
  });

  describe('POST /user/:id/favoritesMovies {movieId: ...} without token', function() {
    var randomMovie;
    before(function () {
      return bootstrap.getRandomMovie().then(function (m) { randomMovie = m; });
    });

    it('should respond 401', function(done) {
      request(app)
        .post('/api/users/'+user._id+'/favoritesMovies/')
        .send(randomMovie)
        .expect(401, done);
    });
  });

  describe('POST /user/:id/favoritesMovies {movieId: ...} of unexistant movie', function() {
    it('should respond 500 unknown movie', function(done) {
      request(app)
        .post('/api/users/'+user._id+'/favoritesMovies/')
        .set('authorization', 'Bearer ' + token)
        .send({_id:31415926}) // unexistant movie
        .expect(500, /unknown movie/, done);
    });
  });

  describe('POST /user/:id/favoritesMovies {movieId: ...} of inactive movie', function() {
    var randomMovie;
    before(function () {
      return bootstrap.getRandomInactiveMovie().then(function (m) { randomMovie = m; });
    });

    it('should respond 200 OK with a movie as a result', function(done) {
      request(app)
        .post('/api/users/'+user._id+'/favoritesMovies/')
        .set('authorization', 'Bearer ' + token)
        .send(randomMovie)
        .expect(500, done);
    });
  });

  describe('GET /user/:id/favoritesMovies after a movie was inactivated', function() {

    before(function () {
      // remove all linked movies
      var db = bootstrap.getSqldb();
      return db.UsersFavoritesMovies.destroy({ where: { userId: user._id } });
    });

    before(function () {
      // add inactive movie to the user favorites (hardcoded)
      return bootstrap.getRandomInactiveMovie().then(function (randomMovie) {
        return user.addFavoritesMovies(randomMovie);
      });
    });

    it('should respond 200 OK with no favorites', function(done) {
      request(app)
        .get('/api/users/'+user._id+'/favoritesMovies/')
        .set('authorization', 'Bearer ' + token)
        .expect('Content-Type', /json/)
        .expect(function (res) {
          assert(Array.isArray(res.body) && res.body.length === 0);
        })
        .expect(200, done);
    });
  });
});
