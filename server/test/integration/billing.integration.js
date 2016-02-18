'use strict';

//
// this file will just test the top of billing api
//   bottom is mocked. (/test/mock-billing-api)
//
var bootstrap = require('../bootstrap.js');

var app = bootstrap.getApp();
var sqldb = bootstrap.getSqldb();
var User = sqldb.User;
var Client = sqldb.Client;
var request = require('supertest');

var assert = require('better-assert');

describe('User API:', function() {
  before(function () {
    return User.destroy({
      where: { email: 'test.integration+billing@afrostream.tv'}
    }).then(function () {
      var user = User.build({
        name: 'toto',
        email: 'test.integration+billing@afrostream.tv',
        password: 'password',
        bouyguesId: "toto42"
      });
      return user.save();
    });
  });

  after(function() {
    return User.destroy({ where: { email: 'test.integration+billing@afrostream.tv' }});
  });

  describe('GET /api/billings/internalplans', function () {
    var bouyguesMiamiClient = null;
    before(function () {
      return Client.find({where: {type: 'legacy-api.bouygues-miami'}}).then(function (c) {
        assert(c, 'client bouygues doesnt exist in db, please seed.');
        bouyguesMiamiClient = c;
        assert(c.billingProviderName === 'bachat');
      });
    });

    var bouyguesMiamiClientToken = null;
    before(function () {
      // login client
      return bootstrap.getClientToken(app, bouyguesMiamiClient).then(function (t) {
        assert(t, 'missing client token');
        bouyguesMiamiClientToken = t;
      });
    });

    // log the user using bouygues client
    var access_token;
    before(function (done) {
      request(app)
        .post('/auth/oauth2/token')
        .send({
          grant_type: 'password',
          client_id: bouyguesMiamiClient.get('_id'),
          client_secret: bouyguesMiamiClient.get('secret'),
          username: 'test.integration+billing@afrostream.tv',
          password: 'password'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          assert(typeof res.body.access_token === 'string');
          assert(typeof res.body.refresh_token === 'string');
          assert(typeof res.body.expires_in === 'number');
          assert(res.body.token_type === 'Bearer');
          access_token = res.body.access_token;
          done();
        });
    });

    it('calling with bouygues client should call the mock using providerName=bachat', function (done) {
      request(app)
        .get('/api/billings/internalplans')
        .set('Authorization', 'Bearer ' + access_token)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          if (err) return done(err);
          assert(res.body[0].calledWithProviderNameBachat === true);
          done();
        });
    });

    it('calling with bouygues client should call the mock using providerName=other', function (done) {
      request(app)
        .get('/api/billings/internalplans')
        .query({providerName: 'other'})
        .set('Authorization', 'Bearer ' + access_token)
        .expect(500)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          if (err) return  done(err);
          assert(res.body.error === 'unknown provider named : unknown');
          done();
        });
    });
  });

  describe('POST /api/billings/subscriptions', function () {
    var bouyguesMiamiClient = null;
    before(function () {
      return Client.find({where: {type: 'legacy-api.bouygues-miami'}}).then(function (c) {
        assert(c, 'client bouygues doesnt exist in db, please seed.');
        bouyguesMiamiClient = c;
      });
    });

    var bouyguesMiamiClientToken = null;
    before(function () {
      // login client
      return bootstrap.getClientToken(app, bouyguesMiamiClient).then(function (t) {
        assert(t, 'missing client token');
        bouyguesMiamiClientToken = t;
      });
    });

    // log the user using bouygues client
    var access_token;
    before(function (done) {
      request(app)
        .post('/auth/oauth2/token')
        .send({
          grant_type: 'password',
          client_id: bouyguesMiamiClient.get('_id'),
          client_secret: bouyguesMiamiClient.get('secret'),
          username: 'test.integration+billing@afrostream.tv',
          password: 'password'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          assert(typeof res.body.access_token === 'string');
          assert(typeof res.body.refresh_token === 'string');
          assert(typeof res.body.expires_in === 'number');
          assert(res.body.token_type === 'Bearer');
          access_token = res.body.access_token;
          done();
        });
    });

    it('calling with bouygues client should call the mock using providerName=bachat', function (done) {
      request(app)
        .post('/api/billings/subscriptions')
        .set('Authorization', 'Bearer ' + access_token)
        .send({
          firstName: "foo",
          lastName: "bar",
          internalPlanUuid: "bachat-afrostreamdaily",
          subscriptionProviderUuid: "42424242"
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          if (err) return done(err);
          assert(res.body.subscriptionBillingUuid === 'SubscriptionBillingUUID');
          done();
        });
    });
  });
});