'use strict';

var bootstrap = require('../bootstrap.js');

var app = bootstrap.getApp();
var sqldb = bootstrap.getSqldb();
var User = sqldb.User;
var Client = sqldb.Client;
var request = require('supertest');

var assert = require('better-assert');

var Q = require('q');

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

  before(function () {
    return User.destroy({where: { bouyguesId: 'abcdef' }});
  })

  before(function () {
    return User.destroy({where: { bouyguesId: 'abcdef-new' }});
  })

  // Clear users after testing
  after(function() {
    return User.destroy({ where: { email: 'test.integration@afrostream.tv' } });
  });

  after(function () {
    return User.destroy({where: { bouyguesId: 'abcdef' }});
  })

  after(function () {
    return User.destroy({where: { bouyguesId: 'abcdef-new' }});
  })

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
          done(err);
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
          done(err);
        });
    });

    it('should respond with a 401 when not authenticated', function(done) {
      request(app)
        .get('/api/users/me')
        .expect(401)
        .end(done);
    });
  });

  describe('POST /api/users/me (bouygues) ', function () {
    before(function() {
      return User.destroy({ where: { $or: [
        { email: 'test.integration+bouygues_miami@afrostream.tv' },
        { email: 'test.integration+bouygues_miami2@afrostream.tv'}
      ]}});
    });

    var bouyguesMiamiClient = null;
    before(function() {
      return Client.find({ where: {type: 'legacy-api.bouygues-miami'}}).then(function (c) {
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

    after(function() {
      return User.destroy({ where: { $or: [
        { email: 'test.integration+bouygues_miami@afrostream.tv' },
        { email: 'test.integration+bouygues_miami2@afrostream.tv'}
      ]}});
    });

    var userId=null;
    it('should create a random user using client bouygues', function (done) {
      request(app)
        .post('/api/users')
        .send({
          access_token: bouyguesMiamiClientToken,
          email: 'test.integration+bouygues_miami@afrostream.tv',
          password: 'password',
          bouyguesId: "abcdef"
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) return done(err);
          request(app)
            .get('/api/users/me')
            .set('Content-type', 'application/json')
            .set('Authorization', 'Bearer ' + res.body.token)
            .expect(200)
            .end(function (err, res) {
              assert(res.body.email === 'test.integration+bouygues_miami@afrostream.tv');
              assert(res.body.bouyguesId === 'abcdef');
              userId = res.body._id;
              done(err);
            });
        });
    });

    it('should be able to create a user with a new bouygues id even if email already exist', function (done) {
      request(app)
        .post('/api/users')
        .send({
          access_token: bouyguesMiamiClientToken,
          email: 'test.integration+bouygues_miami@afrostream.tv',
          password: 'password',
          bouyguesId: "abcdef-new"
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) return done(err);
          request(app)
            .get('/api/users/me')
            .set('Content-type', 'application/json')
            .set('Authorization', 'Bearer ' + res.body.token)
            .expect(200)
            .end(function (err, res) {
              assert(res.body.email === null);
              assert(res.body._id !== userId);

              if (err) { done(err); }

              Q.all([
                User.findOne({where: {_id: userId}}),
                User.findOne({where: {_id: res.body._id}})
              ]).then(function (data) {
                var u1 = data[0];
                var u2 = data[1];

                assert(u1.email === 'test.integration+bouygues_miami@afrostream.tv');
                assert(u2.email === null);
                assert(u1.bouyguesId === 'abcdef');
                assert(u2.bouyguesId === 'abcdef-new');
              })
              .then(function () { done(); }, done);
            });
        });
    });

    it('shouldnt be able to create a user with a malformed email', function (done) {
      request(app)
        .post('/api/users')
        .send({
          access_token: bouyguesMiamiClientToken,
          email: 'niaaaaaa',
          password: 'password',
          bouyguesId: "abcdef"
        }).expect(422)
        .end(function (err, res) {
          assert(res.body.error.indexOf('valid email') !== -1);
          done(err);
        });
    });

    it('shouldnt be able to create a user without bouygues info', function (done) {
      request(app)
        .post('/api/users')
        .send({
          access_token: bouyguesMiamiClientToken,
          email: 'test.integration+bouygues_miami@afrostream.tv',
          password: 'password'
        }).expect(422)
        .end(function (err, res) {
          assert(res.body.error.indexOf('"bouyguesId" is required') !== -1);
          done(err);
        });
    });

    it('shouldnt be able to create a different user with an existing bouygues id', function (done) {
      request(app)
        .post('/api/users')
        .send({
          access_token: bouyguesMiamiClientToken,
          email: 'test.integration+bouygues_miami2@afrostream.tv',
          password: 'password',
          bouyguesId: "abcdef"
        }).expect(422)
        .end(function (err, res) {
          assert(res.body.code === 'SequelizeUniqueConstraintError');
          done(err);
        });
    });

    it('should be able to login with the bouygues id after creation', function (done) {
      request(app)
        .post('/auth/oauth2/token')
        .send({
          grant_type: 'bouygues',
          client_id: bouyguesMiamiClient.get('_id'),
          client_secret: bouyguesMiamiClient.get('secret'),
          id: "abcdef"
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          assert(typeof res.body.access_token === 'string');
          assert(typeof res.body.refresh_token === 'string');
          assert(typeof res.body.expires_in === 'number');
          assert(res.body.token_type === 'Bearer');
          done(err);
        });
    });
  });

  describe('POST /api/users/me (orange) ', function () {
    before(function() {
      return User.destroy({ where: {
        ise2: "PARTNR-200-2Hy2e/PCQ1Y/NPKQPhSeKG3JbZfxQYKk+beCgch2vUQ="
      }});
    });

    var orangeClient = null;
    before(function() {
      return Client.find({ where: {type: 'legacy-api.orange'}}).then(function (c) {
        assert(c, 'client orange doesnt exist in db, please seed.');
        orangeClient = c;
      });
    });

    var orangeClientToken = null;
    before(function () {
      // login client
      return bootstrap.getClientToken(app, orangeClient).then(function (t) {
        assert(t, 'missing client token');
        orangeClientToken = t;
      });
    });

    after(function() {
      return User.destroy({ where: {
        ise2: "PARTNR-200-2Hy2e/PCQ1Y/NPKQPhSeKG3JbZfxQYKk+beCgch2vUQ="
      }});
    });

    it('should not be able to login with an unknown orange ise2 id', function (done) {
      request(app)
        .post('/auth/oauth2/token')
        .set('X_WASSUP_ISE2', 'PARTNR-200-2Hy2e/PCQ1Y/NPKQPhSeKG3JbZfxQYKk+beCgch2vUQ=')
        .send({
          grant_type: 'ise2',
          client_id: orangeClient.get('_id'),
          client_secret: orangeClient.get('secret')
        })
        .expect(403)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          assert(res.body.error_description === 'UNKNOWN_ISE2:PARTNR-200-2Hy2e/PCQ1Y/NPKQPhSeKG3JbZfxQYKk+beCgch2vUQ=');
          done(err);
        });
    });

    it('should create a random user using client orange', function (done) {
      request(app)
        .post('/api/users')
        .send({
          access_token: orangeClientToken,
          ise2: "PARTNR-200-2Hy2e/PCQ1Y/NPKQPhSeKG3JbZfxQYKk+beCgch2vUQ="
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) return done(err);
          request(app)
            .get('/api/users/me')
            .set('Content-type', 'application/json')
            .set('Authorization', 'Bearer ' + res.body.token)
            .expect(200)
            .end(function (err, res) {
              assert(res.body.ise2 === 'PARTNR-200-2Hy2e/PCQ1Y/NPKQPhSeKG3JbZfxQYKk+beCgch2vUQ=');
              done(err);
            });
        });
    });

    it('shouldnt be able to create a user without orange info', function (done) {
      request(app)
        .post('/api/users')
        .send({
          access_token: orangeClientToken
        }).expect(422)
        .end(function (err, res) {
          assert(res.body.error.indexOf('"ise2" is required') !== -1);
          done(err);
        });
    });

    it('shouldnt be able to create a different user with an existing orange ise2 id', function (done) {
      request(app)
        .post('/api/users')
        .send({
          access_token: orangeClientToken,
          ise2: "PARTNR-200-2Hy2e/PCQ1Y/NPKQPhSeKG3JbZfxQYKk+beCgch2vUQ="
        }).expect(422)
        .end(function (err, res) {
          assert(res.body.code === 'SequelizeUniqueConstraintError');
          done(err);
        });
    });

    it('should be able to login with the orange ise2 id after creation', function (done) {
      request(app)
        .post('/auth/oauth2/token')
        .set('X_WASSUP_ISE2', 'PARTNR-200-2Hy2e/PCQ1Y/NPKQPhSeKG3JbZfxQYKk+beCgch2vUQ=')
        .send({
          grant_type: 'ise2',
          client_id: orangeClient.get('_id'),
          client_secret: orangeClient.get('secret')
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          assert(typeof res.body.access_token === 'string');
          assert(typeof res.body.refresh_token === 'string');
          assert(typeof res.body.expires_in === 'number');
          assert(res.body.token_type === 'Bearer');
          done(err);
        });
    });
  });

  describe('PUT /api/users/me', function () {
    before(function () {
      return User.destroy({
        where: {
          $or: [
            {email: 'test.integration+bouygues_miami@afrostream.tv'},
            {email: 'test.integration+bouygues_miami2@afrostream.tv'}
          ]
        }
      }).then(function () {
        var user = User.build({
          name: 'toto',
          email: 'test.integration+bouygues_miami@afrostream.tv',
          password: 'password',
          bouyguesId: "toto42"
        });
        return user.save();
      });
    });

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

    var access_token;
    before(function (done) {
      request(app)
        .post('/auth/oauth2/token')
        .send({
          grant_type: 'password',
          client_id: bouyguesMiamiClient.get('_id'),
          client_secret: bouyguesMiamiClient.get('secret'),
          username: 'test.integration+bouygues_miami@afrostream.tv',
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

    after(function() {
      return User.destroy({ where: { $or: [
        { email: 'test.integration+bouygues_miami@afrostream.tv' },
        { email: 'test.integration+bouygues_miami2@afrostream.tv'}
      ]}});
    });

    it('should update name, first_name, last_name, email, bouyguesId', function (done) {
      request(app)
        .put('/api/users/me')
        .set('Authorization', 'Bearer ' + access_token)
        .send({
          /* FIXME_023 TO BE ENABLED AFTER update code changes */
          /*
          name: "titi",
          first_name: "aaa",
          last_name: "bbb",
          email: "test.integration+bouygues_miami2@afrostream.tv",
          */
          bouyguesId: '42424343'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          if (err) return done(err);
          User.findById(res.body._id).then(function (user) {
            /* TO BE ENABLED AFTER update code changes */
            /*
            assert(user.name === 'titi');
            assert(user.first_name === 'aaa');
            assert(user.last_name === 'bbb');
            assert(user.email === 'test.integration+bouygues_miami2@afrostream.tv');
            */
            assert(user.bouyguesId === '42424343');
            done();
          });
        });
    });

    /* FIXME_023 TO BE ENABLED AFTER update code changes */
    /*
    it('shouldnt update with a wrong email', function (done) {
      request(app)
        .put('/api/users/me')
        .set('Authorization', 'Bearer ' + access_token)
        .send({
          email: "test.integration"
        })
        .expect(422)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          assert(res.body.error.indexOf('valid email') !== -1);
          done(err);
        });
    });
    */
  });
});
