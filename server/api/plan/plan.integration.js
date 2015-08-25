'use strict';

var app = require('../../app');
var request = require('supertest');

var newPlan;

describe('Plan API:', function() {

  describe('GET /api/plans', function() {
    var plans;

    beforeEach(function(done) {
      request(app)
        .get('/api/plans')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          plans = res.body;
          done();
        });
    });

    it('should respond with JSON array', function() {
      plans.should.be.instanceOf(Array);
    });

  });

  describe('POST /api/plans', function() {
    beforeEach(function(done) {
      request(app)
        .post('/api/plans')
        .send({
          name: 'New Plan',
          info: 'This is the brand new plan!!!'
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          newPlan = res.body;
          done();
        });
    });

    it('should respond with the newly created plan', function() {
      newPlan.name.should.equal('New Plan');
      newPlan.info.should.equal('This is the brand new plan!!!');
    });

  });

  describe('GET /api/plans/:id', function() {
    var plan;

    beforeEach(function(done) {
      request(app)
        .get('/api/plans/' + newPlan._id)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          plan = res.body;
          done();
        });
    });

    afterEach(function() {
      plan = {};
    });

    it('should respond with the requested plan', function() {
      plan.name.should.equal('New Plan');
      plan.info.should.equal('This is the brand new plan!!!');
    });

  });

  describe('PUT /api/plans/:id', function() {
    var updatedPlan

    beforeEach(function(done) {
      request(app)
        .put('/api/plans/' + newPlan._id)
        .send({
          name: 'Updated Plan',
          info: 'This is the updated plan!!!'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          updatedPlan = res.body;
          done();
        });
    });

    afterEach(function() {
      updatedPlan = {};
    });

    it('should respond with the updated plan', function() {
      updatedPlan.name.should.equal('Updated Plan');
      updatedPlan.info.should.equal('This is the updated plan!!!');
    });

  });

  describe('DELETE /api/plans/:id', function() {

    it('should respond with 204 on successful removal', function(done) {
      request(app)
        .delete('/api/plans/' + newPlan._id)
        .expect(204)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should respond with 404 when plan does not exist', function(done) {
      request(app)
        .delete('/api/plans/' + newPlan._id)
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
