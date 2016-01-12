'use strict';

var bootstrap = require('../bootstrap.js');

var app = bootstrap.getApp();
var sqldb = bootstrap.getSqldb();
var WaitingUser = sqldb.WaitingUser;
var request = require('supertest');

var assert = require('better-assert');

var config = rootRequire('/server/config');

describe('WaitingUser API:', function() {
  var user;

  // Clear users before testing
  before(function() {
    return WaitingUser.destroy({ where: { email: 'test.integration.wu@afrostream.tv' } });
  });

  // Clear users after testing
  after(function() {
    return WaitingUser.destroy({ where: { email: 'test.integration.wu@afrostream.tv' } });
  });

  it('should respond 200 OK', function(done) {
    // login using client access.
    request(app)
      .post('/api/waitingUsers/')
      .set('bypass-auth', 'true')
      .set('user-email', 'test@test.com')
      .send({
        email: 'test.integration.wu@afrostream.tv'
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) { done(err); }
        else {
          done();
        }
      });
  });

  it('should exist a newuser in waitingUsers table', function(done) {
    WaitingUser.find({where: { email: 'test.integration.wu@afrostream.tv' } })
      .then(function (waitingUser) {
        if (!waitingUser) {
          done('missing waiting user :(');
        } else {
          done();
        }
      })
      .catch(function (e) { done(e); });
  });
});
