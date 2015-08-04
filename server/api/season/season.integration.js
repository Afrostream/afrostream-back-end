'use strict';

var app = require('../../app');
var request = require('supertest');

var newSeason;

describe('Season API:', function() {

  describe('GET /api/seasons', function() {
    var seasons;

    beforeEach(function(done) {
      request(app)
        .get('/api/seasons')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          seasons = res.body;
          done();
        });
    });

    it('should respond with JSON array', function() {
      seasons.should.be.instanceOf(Array);
    });

  });

  describe('POST /api/seasons', function() {
    beforeEach(function(done) {
      request(app)
        .post('/api/seasons')
        .send({
          name: 'New Season',
          info: 'This is the brand new season!!!'
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          newSeason = res.body;
          done();
        });
    });

    it('should respond with the newly created season', function() {
      newSeason.name.should.equal('New Season');
      newSeason.info.should.equal('This is the brand new season!!!');
    });

  });

  describe('GET /api/seasons/:id', function() {
    var season;

    beforeEach(function(done) {
      request(app)
        .get('/api/seasons/' + newSeason._id)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          season = res.body;
          done();
        });
    });

    afterEach(function() {
      season = {};
    });

    it('should respond with the requested season', function() {
      season.name.should.equal('New Season');
      season.info.should.equal('This is the brand new season!!!');
    });

  });

  describe('PUT /api/seasons/:id', function() {
    var updatedSeason

    beforeEach(function(done) {
      request(app)
        .put('/api/seasons/' + newSeason._id)
        .send({
          name: 'Updated Season',
          info: 'This is the updated season!!!'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          updatedSeason = res.body;
          done();
        });
    });

    afterEach(function() {
      updatedSeason = {};
    });

    it('should respond with the updated season', function() {
      updatedSeason.name.should.equal('Updated Season');
      updatedSeason.info.should.equal('This is the updated season!!!');
    });

  });

  describe('DELETE /api/seasons/:id', function() {

    it('should respond with 204 on successful removal', function(done) {
      request(app)
        .delete('/api/seasons/' + newSeason._id)
        .expect(204)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should respond with 404 when season does not exist', function(done) {
      request(app)
        .delete('/api/seasons/' + newSeason._id)
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
