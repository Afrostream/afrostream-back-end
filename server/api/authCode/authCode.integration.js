'use strict';

var app = require('../../app');
var request = require('supertest');

var newAuthCode;

describe('AuthCode API:', function() {

  describe('GET /api/authCodes', function() {
    var authCodes;

    beforeEach(function(done) {
      request(app)
        .get('/api/authCodes')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          authCodes = res.body;
          done();
        });
    });

    it('should respond with JSON array', function() {
      authCodes.should.be.instanceOf(Array);
    });

  });

  describe('POST /api/authCodes', function() {
    beforeEach(function(done) {
      request(app)
        .post('/api/authCodes')
        .send({
          name: 'New AuthCode',
          info: 'This is the brand new authCode!!!'
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          newAuthCode = res.body;
          done();
        });
    });

    it('should respond with the newly created authCode', function() {
      newAuthCode.name.should.equal('New AuthCode');
      newAuthCode.info.should.equal('This is the brand new authCode!!!');
    });

  });

  describe('GET /api/authCodes/:id', function() {
    var authCode;

    beforeEach(function(done) {
      request(app)
        .get('/api/authCodes/' + newAuthCode._id)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          authCode = res.body;
          done();
        });
    });

    afterEach(function() {
      authCode = {};
    });

    it('should respond with the requested authCode', function() {
      authCode.name.should.equal('New AuthCode');
      authCode.info.should.equal('This is the brand new authCode!!!');
    });

  });

  describe('PUT /api/authCodes/:id', function() {
    var updatedAuthCode

    beforeEach(function(done) {
      request(app)
        .put('/api/authCodes/' + newAuthCode._id)
        .send({
          name: 'Updated AuthCode',
          info: 'This is the updated authCode!!!'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          updatedAuthCode = res.body;
          done();
        });
    });

    afterEach(function() {
      updatedAuthCode = {};
    });

    it('should respond with the updated authCode', function() {
      updatedAuthCode.name.should.equal('Updated AuthCode');
      updatedAuthCode.info.should.equal('This is the updated authCode!!!');
    });

  });

  describe('DELETE /api/authCodes/:id', function() {

    it('should respond with 204 on successful removal', function(done) {
      request(app)
        .delete('/api/authCodes/' + newAuthCode._id)
        .expect(204)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should respond with 404 when authCode does not exist', function(done) {
      request(app)
        .delete('/api/authCodes/' + newAuthCode._id)
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
