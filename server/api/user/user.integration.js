'use strict';

var bootstrap = require('../../../tests/bootstrap.js');

var app = bootstrap.getApp();
var sqldb = bootstrap.getSqldb();
var User = sqldb.User;
var request = require('supertest');

var assert = require('better-assert');

describe('User API:', function() {
  var user;

  // Clear users before testing
  before(function() {
    return User.destroy({ where: { email: 'test.integration@afrostream.tv' } }).then(function() {
      user = User.build({
        name: 'Fake User',
        email: 'test.integration@afrostream.tv',
        password: 'password'
      });
      return user.save();
    });
  });

  // Clear users after testing
  after(function() {
    return User.destroy({ where: { email: 'test.integration@afrostream.tv' } });
  });

  describe('GET /api/users/me', function() {
    var token;

    before(function(done) {
      request(app)
        .post('/auth/local')
        .send({
          email: 'test.integration@afrostream.tv',
          password: 'password'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          token = res.body.token;
          done();
        });
    });

    it('should respond with a user profile when authenticated', function(done) {
      request(app)
        .get('/api/users/me')
        .set('authorization', 'Bearer ' + token)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          assert(String(res.body._id) === String(user._id));
          done();
        });
    });

    it('should respond with a 401 when not authenticated', function(done) {
      request(app)
        .get('/api/users/me')
        .expect(401)
        .end(done);
    });
  });
});
