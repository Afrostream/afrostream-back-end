'use strict';

var app = require('../../app');
var request = require('supertest');

var newClient;

describe('Client API:', function() {

  describe('GET /api/clients', function() {
    var clients;

    beforeEach(function(done) {
      request(app)
        .get('/api/clients')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          clients = res.body;
          done();
        });
    });

    it('should respond with JSON array', function() {
      clients.should.be.instanceOf(Array);
    });

  });

  describe('POST /api/clients', function() {
    beforeEach(function(done) {
      request(app)
        .post('/api/clients')
        .send({
          name: 'New Client',
          info: 'This is the brand new client!!!'
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          newClient = res.body;
          done();
        });
    });

    it('should respond with the newly created client', function() {
      newClient.name.should.equal('New Client');
      newClient.info.should.equal('This is the brand new client!!!');
    });

  });

  describe('GET /api/clients/:id', function() {
    var client;

    beforeEach(function(done) {
      request(app)
        .get('/api/clients/' + newClient._id)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          client = res.body;
          done();
        });
    });

    afterEach(function() {
      client = {};
    });

    it('should respond with the requested client', function() {
      client.name.should.equal('New Client');
      client.info.should.equal('This is the brand new client!!!');
    });

  });

  describe('PUT /api/clients/:id', function() {
    var updatedClient

    beforeEach(function(done) {
      request(app)
        .put('/api/clients/' + newClient._id)
        .send({
          name: 'Updated Client',
          info: 'This is the updated client!!!'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          updatedClient = res.body;
          done();
        });
    });

    afterEach(function() {
      updatedClient = {};
    });

    it('should respond with the updated client', function() {
      updatedClient.name.should.equal('Updated Client');
      updatedClient.info.should.equal('This is the updated client!!!');
    });

  });

  describe('DELETE /api/clients/:id', function() {

    it('should respond with 204 on successful removal', function(done) {
      request(app)
        .delete('/api/clients/' + newClient._id)
        .expect(204)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should respond with 404 when client does not exist', function(done) {
      request(app)
        .delete('/api/clients/' + newClient._id)
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
