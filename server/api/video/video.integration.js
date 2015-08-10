'use strict';

var app = require('../../app');
var request = require('supertest');

var newVideo;

describe('Video API:', function() {

  describe('GET /api/videos', function() {
    var videos;

    beforeEach(function(done) {
      request(app)
        .get('/api/videos')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          videos = res.body;
          done();
        });
    });

    it('should respond with JSON array', function() {
      videos.should.be.instanceOf(Array);
    });

  });

  describe('POST /api/videos', function() {
    beforeEach(function(done) {
      request(app)
        .post('/api/videos')
        .send({
          name: 'New Video',
          info: 'This is the brand new video!!!'
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          newVideo = res.body;
          done();
        });
    });

    it('should respond with the newly created video', function() {
      newVideo.name.should.equal('New Video');
      newVideo.info.should.equal('This is the brand new video!!!');
    });

  });

  describe('GET /api/videos/:id', function() {
    var video;

    beforeEach(function(done) {
      request(app)
        .get('/api/videos/' + newVideo._id)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          video = res.body;
          done();
        });
    });

    afterEach(function() {
      video = {};
    });

    it('should respond with the requested video', function() {
      video.name.should.equal('New Video');
      video.info.should.equal('This is the brand new video!!!');
    });

  });

  describe('PUT /api/videos/:id', function() {
    var updatedVideo

    beforeEach(function(done) {
      request(app)
        .put('/api/videos/' + newVideo._id)
        .send({
          name: 'Updated Video',
          info: 'This is the updated video!!!'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          updatedVideo = res.body;
          done();
        });
    });

    afterEach(function() {
      updatedVideo = {};
    });

    it('should respond with the updated video', function() {
      updatedVideo.name.should.equal('Updated Video');
      updatedVideo.info.should.equal('This is the updated video!!!');
    });

  });

  describe('DELETE /api/videos/:id', function() {

    it('should respond with 204 on successful removal', function(done) {
      request(app)
        .delete('/api/videos/' + newVideo._id)
        .expect(204)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should respond with 404 when video does not exist', function(done) {
      request(app)
        .delete('/api/videos/' + newVideo._id)
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
