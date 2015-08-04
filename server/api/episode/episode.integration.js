'use strict';

var app = require('../../app');
var request = require('supertest');

var newEpisode;

describe('Episode API:', function() {

  describe('GET /api/episodes', function() {
    var episodes;

    beforeEach(function(done) {
      request(app)
        .get('/api/episodes')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          episodes = res.body;
          done();
        });
    });

    it('should respond with JSON array', function() {
      episodes.should.be.instanceOf(Array);
    });

  });

  describe('POST /api/episodes', function() {
    beforeEach(function(done) {
      request(app)
        .post('/api/episodes')
        .send({
          name: 'New Episode',
          info: 'This is the brand new episode!!!'
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          newEpisode = res.body;
          done();
        });
    });

    it('should respond with the newly created episode', function() {
      newEpisode.name.should.equal('New Episode');
      newEpisode.info.should.equal('This is the brand new episode!!!');
    });

  });

  describe('GET /api/episodes/:id', function() {
    var episode;

    beforeEach(function(done) {
      request(app)
        .get('/api/episodes/' + newEpisode._id)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          episode = res.body;
          done();
        });
    });

    afterEach(function() {
      episode = {};
    });

    it('should respond with the requested episode', function() {
      episode.name.should.equal('New Episode');
      episode.info.should.equal('This is the brand new episode!!!');
    });

  });

  describe('PUT /api/episodes/:id', function() {
    var updatedEpisode

    beforeEach(function(done) {
      request(app)
        .put('/api/episodes/' + newEpisode._id)
        .send({
          name: 'Updated Episode',
          info: 'This is the updated episode!!!'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          updatedEpisode = res.body;
          done();
        });
    });

    afterEach(function() {
      updatedEpisode = {};
    });

    it('should respond with the updated episode', function() {
      updatedEpisode.name.should.equal('Updated Episode');
      updatedEpisode.info.should.equal('This is the updated episode!!!');
    });

  });

  describe('DELETE /api/episodes/:id', function() {

    it('should respond with 204 on successful removal', function(done) {
      request(app)
        .delete('/api/episodes/' + newEpisode._id)
        .expect(204)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should respond with 404 when episode does not exist', function(done) {
      request(app)
        .delete('/api/episodes/' + newEpisode._id)
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
