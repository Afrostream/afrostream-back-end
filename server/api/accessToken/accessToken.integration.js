'use strict';

var app = require('../../app');
var request = require('supertest');

var newAccessToken;

describe('AccessToken API:', function() {

  describe('GET /api/accessTokens', function() {
    var accessTokens;

    beforeEach(function(done) {
      request(app)
        .get('/api/accessTokens')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          accessTokens = res.body;
          done();
        });
    });

    it('should respond with JSON array', function() {
      accessTokens.should.be.instanceOf(Array);
    });

  });

  describe('POST /api/accessTokens', function() {
    beforeEach(function(done) {
      request(app)
        .post('/api/accessTokens')
        .send({
          name: 'New AccessToken',
          info: 'This is the brand new accessToken!!!'
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          newAccessToken = res.body;
          done();
        });
    });

    it('should respond with the newly created accessToken', function() {
      newAccessToken.name.should.equal('New AccessToken');
      newAccessToken.info.should.equal('This is the brand new accessToken!!!');
    });

  });

  describe('GET /api/accessTokens/:id', function() {
    var accessToken;

    beforeEach(function(done) {
      request(app)
        .get('/api/accessTokens/' + newAccessToken._id)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          accessToken = res.body;
          done();
        });
    });

    afterEach(function() {
      accessToken = {};
    });

    it('should respond with the requested accessToken', function() {
      accessToken.name.should.equal('New AccessToken');
      accessToken.info.should.equal('This is the brand new accessToken!!!');
    });

  });

  describe('PUT /api/accessTokens/:id', function() {
    var updatedAccessToken

    beforeEach(function(done) {
      request(app)
        .put('/api/accessTokens/' + newAccessToken._id)
        .send({
          name: 'Updated AccessToken',
          info: 'This is the updated accessToken!!!'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          updatedAccessToken = res.body;
          done();
        });
    });

    afterEach(function() {
      updatedAccessToken = {};
    });

    it('should respond with the updated accessToken', function() {
      updatedAccessToken.name.should.equal('Updated AccessToken');
      updatedAccessToken.info.should.equal('This is the updated accessToken!!!');
    });

  });

  describe('DELETE /api/accessTokens/:id', function() {

    it('should respond with 204 on successful removal', function(done) {
      request(app)
        .delete('/api/accessTokens/' + newAccessToken._id)
        .expect(204)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should respond with 404 when accessToken does not exist', function(done) {
      request(app)
        .delete('/api/accessTokens/' + newAccessToken._id)
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
