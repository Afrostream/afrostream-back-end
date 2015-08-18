'use strict';

var app = require('../../app');
var request = require('supertest');

var newRefreshToken;

describe('RefreshToken API:', function() {

  describe('GET /api/refreshTokens', function() {
    var refreshTokens;

    beforeEach(function(done) {
      request(app)
        .get('/api/refreshTokens')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          refreshTokens = res.body;
          done();
        });
    });

    it('should respond with JSON array', function() {
      refreshTokens.should.be.instanceOf(Array);
    });

  });

  describe('POST /api/refreshTokens', function() {
    beforeEach(function(done) {
      request(app)
        .post('/api/refreshTokens')
        .send({
          name: 'New RefreshToken',
          info: 'This is the brand new refreshToken!!!'
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          newRefreshToken = res.body;
          done();
        });
    });

    it('should respond with the newly created refreshToken', function() {
      newRefreshToken.name.should.equal('New RefreshToken');
      newRefreshToken.info.should.equal('This is the brand new refreshToken!!!');
    });

  });

  describe('GET /api/refreshTokens/:id', function() {
    var refreshToken;

    beforeEach(function(done) {
      request(app)
        .get('/api/refreshTokens/' + newRefreshToken._id)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          refreshToken = res.body;
          done();
        });
    });

    afterEach(function() {
      refreshToken = {};
    });

    it('should respond with the requested refreshToken', function() {
      refreshToken.name.should.equal('New RefreshToken');
      refreshToken.info.should.equal('This is the brand new refreshToken!!!');
    });

  });

  describe('PUT /api/refreshTokens/:id', function() {
    var updatedRefreshToken

    beforeEach(function(done) {
      request(app)
        .put('/api/refreshTokens/' + newRefreshToken._id)
        .send({
          name: 'Updated RefreshToken',
          info: 'This is the updated refreshToken!!!'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          updatedRefreshToken = res.body;
          done();
        });
    });

    afterEach(function() {
      updatedRefreshToken = {};
    });

    it('should respond with the updated refreshToken', function() {
      updatedRefreshToken.name.should.equal('Updated RefreshToken');
      updatedRefreshToken.info.should.equal('This is the updated refreshToken!!!');
    });

  });

  describe('DELETE /api/refreshTokens/:id', function() {

    it('should respond with 204 on successful removal', function(done) {
      request(app)
        .delete('/api/refreshTokens/' + newRefreshToken._id)
        .expect(204)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should respond with 404 when refreshToken does not exist', function(done) {
      request(app)
        .delete('/api/refreshTokens/' + newRefreshToken._id)
        .expect(404)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          done();
        });
    });

  });

});
