'use strict';

var app = require('../../app');
var request = require('supertest');

var newSubscription;

describe('Subscription API:', function() {

  describe('GET /api/subscriptions', function() {
    var subscriptions;

    beforeEach(function(done) {
      request(app)
        .get('/api/subscriptions')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          subscriptions = res.body;
          done();
        });
    });

    it('should respond with JSON array', function() {
      subscriptions.should.be.instanceOf(Array);
    });

  });

  describe('POST /api/subscriptions', function() {
    beforeEach(function(done) {
      request(app)
        .post('/api/subscriptions')
        .send({
          name: 'New Subscription',
          info: 'This is the brand new subscription!!!'
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          newSubscription = res.body;
          done();
        });
    });

    it('should respond with the newly created subscription', function() {
      newSubscription.name.should.equal('New Subscription');
      newSubscription.info.should.equal('This is the brand new subscription!!!');
    });

  });

  describe('GET /api/subscriptions/:id', function() {
    var subscription;

    beforeEach(function(done) {
      request(app)
        .get('/api/subscriptions/' + newSubscription._id)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          subscription = res.body;
          done();
        });
    });

    afterEach(function() {
      subscription = {};
    });

    it('should respond with the requested subscription', function() {
      subscription.name.should.equal('New Subscription');
      subscription.info.should.equal('This is the brand new subscription!!!');
    });

  });

  describe('PUT /api/subscriptions/:id', function() {
    var updatedSubscription

    beforeEach(function(done) {
      request(app)
        .put('/api/subscriptions/' + newSubscription._id)
        .send({
          name: 'Updated Subscription',
          info: 'This is the updated subscription!!!'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          updatedSubscription = res.body;
          done();
        });
    });

    afterEach(function() {
      updatedSubscription = {};
    });

    it('should respond with the updated subscription', function() {
      updatedSubscription.name.should.equal('Updated Subscription');
      updatedSubscription.info.should.equal('This is the updated subscription!!!');
    });

  });

  describe('DELETE /api/subscriptions/:id', function() {

    it('should respond with 204 on successful removal', function(done) {
      request(app)
        .delete('/api/subscriptions/' + newSubscription._id)
        .expect(204)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should respond with 404 when subscription does not exist', function(done) {
      request(app)
        .delete('/api/subscriptions/' + newSubscription._id)
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
