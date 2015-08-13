'use strict';

var app = require('../../app');
var request = require('supertest');

var newLicensor;

describe('Licensor API:', function() {

  describe('GET /api/licensors', function() {
    var licensors;

    beforeEach(function(done) {
      request(app)
        .get('/api/licensors')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          licensors = res.body;
          done();
        });
    });

    it('should respond with JSON array', function() {
      licensors.should.be.instanceOf(Array);
    });

  });

  describe('POST /api/licensors', function() {
    beforeEach(function(done) {
      request(app)
        .post('/api/licensors')
        .send({
          name: 'New Licensor',
          info: 'This is the brand new licensor!!!'
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          newLicensor = res.body;
          done();
        });
    });

    it('should respond with the newly created licensor', function() {
      newLicensor.name.should.equal('New Licensor');
      newLicensor.info.should.equal('This is the brand new licensor!!!');
    });

  });

  describe('GET /api/licensors/:id', function() {
    var licensor;

    beforeEach(function(done) {
      request(app)
        .get('/api/licensors/' + newLicensor._id)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          licensor = res.body;
          done();
        });
    });

    afterEach(function() {
      licensor = {};
    });

    it('should respond with the requested licensor', function() {
      licensor.name.should.equal('New Licensor');
      licensor.info.should.equal('This is the brand new licensor!!!');
    });

  });

  describe('PUT /api/licensors/:id', function() {
    var updatedLicensor

    beforeEach(function(done) {
      request(app)
        .put('/api/licensors/' + newLicensor._id)
        .send({
          name: 'Updated Licensor',
          info: 'This is the updated licensor!!!'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          updatedLicensor = res.body;
          done();
        });
    });

    afterEach(function() {
      updatedLicensor = {};
    });

    it('should respond with the updated licensor', function() {
      updatedLicensor.name.should.equal('Updated Licensor');
      updatedLicensor.info.should.equal('This is the updated licensor!!!');
    });

  });

  describe('DELETE /api/licensors/:id', function() {

    it('should respond with 204 on successful removal', function(done) {
      request(app)
        .delete('/api/licensors/' + newLicensor._id)
        .expect(204)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should respond with 404 when licensor does not exist', function(done) {
      request(app)
        .delete('/api/licensors/' + newLicensor._id)
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
