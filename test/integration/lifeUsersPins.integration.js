'use strict';

var bootstrap = require('../bootstrap.js');

var app = bootstrap.getApp();
var sqldb = bootstrap.getSqldb();
var User = sqldb.User;
var LifePin = sqldb.LifePin;
var request = require('supertest');

var assert = require('better-assert');

var Q = require('q');

describe('User API:', function() {
  var user, pin;

  var email = 'test.integration+lifeuserpin@afrostream.tv';

  // Clear users before testing
  before(function() {
    return User.destroy({ where: { email: email } }).then(function() {
      user = User.build({
        name: 'Fake User',
        email: email,
        password: 'password'
      });
      return user.save();
    });
  });

  before(function () {
    return LifePin.destroy({where: { type: 'test' }}).then(function () {
      pin = LifePin.build({
        type: 'test',
        title: 'test pin',
        userId: user._id,
        active:true
      });
      return pin.save();
    })
  })

  // Clear users after testing
  after(function() {
    return User.destroy({ where: { email: 'test.integration+lifeUserPin@afrostream.tv' } });
  });

  after(function () {
    return LifePin.destroy({where: { type: 'test' }});
  });

  describe('GET /api/life/users/me/pins', function () {
    var token;

    before(function(done) {
      request(app)
        .post('/auth/local')
        .send({
          email: email,
          password: 'password'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          token = res.body.token;
          done(err);
        });
    });

    it('should respond with empty content liked', function (done) {
      request(app)
        .get('/api/life/users/me/pins')
        .set('authorization', 'Bearer ' + token)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          assert(Array.isArray(res.body));
          assert(res.body.length === 0);
          done(err);
        });
    });

    it('should respond 0 to nb of likes on the pin', function (done) {
      request(app)
        .get('/api/life/pins/'+pin._id)
        .set('authorization', 'Bearer ' + token)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          assert(res.body);
          assert(res.body.likes === 0);
          done(err);
        });
    });

    it('should respond 200 OK when associate user to pin', function (done) {
      request(app)
        .put('/api/life/users/me/pins/'+pin._id)
        .set('authorization', 'Bearer ' + token)
        .send({liked:true})
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          console.log(res.body);
          assert(res.body);
          assert(res.body.liked === true);
          done(err);
        });
    });

    it('should respond 1 to nb of likes on the pin', function (done) {
      request(app)
        .get('/api/life/pins/'+pin._id)
        .set('authorization', 'Bearer ' + token)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          assert(res.body);
          assert(res.body.likes === 1);
          done(err);
        });
    });

  });


});
