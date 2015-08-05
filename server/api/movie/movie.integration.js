'use strict';

var app = require('../../app');
var request = require('supertest');

var newMovie;

describe('Movie API:', function () {

  describe('GET /api/movies', function () {
    var movies;

    beforeEach(function (done) {
      request(app)
        .get('/api/movies')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }
          movies = res.body;
          done();
        });
    });

    it('should respond with JSON array', function () {
      movies.should.be.instanceOf(Array);
    });

  });
  /*
   describe('POST /api/movies', function () {
   beforeEach(function (done) {
   request(app)
   .post('/api/movies')
   .send({
   title: 'New Movie',
   synopsis: 'This is the brand new movie!!!'
   })
   .expect(201)
   .expect('Content-Type', /json/)
   .end(function (err, res) {
   if (err) {
   return done(err);
   }
   newMovie = res.body;
   done();
   });
   });

   it('should respond with the newly created movie', function () {
   newMovie.title.should.equal('New Movie');
   newMovie.synopsis.should.equal('This is the brand new movie!!!');
   });

   });

   describe('GET /api/movies/:id', function () {
   var movie;

   beforeEach(function (done) {
   request(app)
   .get('/api/movies/' + newMovie._id)
   .expect(200)
   .expect('Content-Type', /json/)
   .end(function (err, res) {
   if (err) {
   return done(err);
   }
   movie = res.body;
   done();
   });
   });

   afterEach(function () {
   movie = {};
   });

   it('should respond with the requested movie', function () {
   movie.title.should.equal('New Movie');
   movie.synopsis.should.equal('This is the brand new movie!!!');
   });

   });

   describe('PUT /api/movies/:id', function () {
   var updatedMovie

   beforeEach(function (done) {
   request(app)
   .put('/api/movies/' + newMovie._id)
   .send({
   title: 'Updated Movie',
   synopsis: 'This is the updated movie!!!'
   })
   .expect(200)
   .expect('Content-Type', /json/)
   .end(function (err, res) {
   if (err) {
   return done(err);
   }
   updatedMovie = res.body;
   done();
   });
   });

   afterEach(function () {
   updatedMovie = {};
   });

   it('should respond with the updated movie', function () {
   updatedMovie.title.should.equal('Updated Movie');
   updatedMovie.synopsis.should.equal('This is the updated movie!!!');
   });

   });

   describe('DELETE /api/movies/:id', function () {

   it('should respond with 204 on successful removal', function (done) {
   request(app)
   .delete('/api/movies/' + newMovie._id)
   .expect(204)
   .end(function (err, res) {
   if (err) {
   return done(err);
   }
   done();
   });
   });

   it('should respond with 404 when movie does not exist', function (done) {
   request(app)
   .delete('/api/movies/' + newMovie._id)
   .expect(404)
   .end(function (err, res) {
   if (err) {
   return done(err);
   }
   done();
   });
   });

   });
   */

});
