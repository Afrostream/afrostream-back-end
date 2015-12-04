'use strict';

var bootstrap = require('../../../tests/bootstrap.js');

var request = require('supertest');

var assert = require('better-assert');

describe('API: /api/catchup/*', function() {
  var app = bootstrap.getApp();
  var staticserver;

  //
  // SETUP: spawning a fake static server.
  //
  before(function (done) {
    var staticapp = require('express')();
    staticapp.get('/fake.xml', function (req, res) {
      var fs = require('fs');
      var xml = fs.readFileSync(__basedir + '/tests/data/catchup-bet-example-001.xml');
      res.send(xml);
    });
    staticserver = staticapp.listen(47611, function () { done(); });
  });

  // Clear users favorite episodes after testing
  after(function () {
    staticserver.close();
  });

  describe('POST /api/catchup/bet', function() {
    it('should respond 200 OK with status=success', function(done) {
      request(app)
        .post('/api/catchup/bet')
        .send({
          sharedSecret: "62b8557f248035275f6f8219fed7e9703d59509c",
          xml: 'http://localhost:47611/fake.xml',
          mamId: 1316 // big
        })
        .expect('Content-Type', /json/)
        .expect(function (res) {
          assert(res.body.status === 'success');
        })
        .expect(200, done);
    });
  });
});
