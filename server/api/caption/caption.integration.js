'use strict';

var app = require('../../app');
var request = require('supertest');

var newCaption;

describe('Caption API:', function() {

  describe('GET /api/captions', function() {
    var captions;

    beforeEach(function(done) {
      request(app)
        .get('/api/captions')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          captions = res.body;
          done();
        });
    });

    it('should respond with JSON array', function() {
      captions.should.be.instanceOf(Array);
    });

  });

  describe('POST /api/captions', function() {
    beforeEach(function(done) {
      request(app)
        .post('/api/captions')
        .send({
          name: 'New Caption',
          info: 'This is the brand new caption!!!'
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          newCaption = res.body;
          done();
        });
    });

    it('should respond with the newly created caption', function() {
      newCaption.name.should.equal('New Caption');
      newCaption.info.should.equal('This is the brand new caption!!!');
    });

  });

  describe('GET /api/captions/:id', function() {
    var caption;

    beforeEach(function(done) {
      request(app)
        .get('/api/captions/' + newCaption._id)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          caption = res.body;
          done();
        });
    });

    afterEach(function() {
      caption = {};
    });

    it('should respond with the requested caption', function() {
      caption.name.should.equal('New Caption');
      caption.info.should.equal('This is the brand new caption!!!');
    });

  });

  describe('PUT /api/captions/:id', function() {
    var updatedCaption

    beforeEach(function(done) {
      request(app)
        .put('/api/captions/' + newCaption._id)
        .send({
          name: 'Updated Caption',
          info: 'This is the updated caption!!!'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          updatedCaption = res.body;
          done();
        });
    });

    afterEach(function() {
      updatedCaption = {};
    });

    it('should respond with the updated caption', function() {
      updatedCaption.name.should.equal('Updated Caption');
      updatedCaption.info.should.equal('This is the updated caption!!!');
    });

  });

  describe('DELETE /api/captions/:id', function() {

    it('should respond with 204 on successful removal', function(done) {
      request(app)
        .delete('/api/captions/' + newCaption._id)
        .expect(204)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should respond with 404 when caption does not exist', function(done) {
      request(app)
        .delete('/api/captions/' + newCaption._id)
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
