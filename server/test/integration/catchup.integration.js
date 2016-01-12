'use strict';

var bootstrap = require('../bootstrap.js');

var request = require('supertest');

var assert = require('better-assert');

var config = rootRequire('/server/config');

describe('API: /api/catchup/*', function() {
  var app = bootstrap.getApp();
  var staticserver;

  var jobsConf =

  //
  // SETUP: spawning a fake static server.
  //
  before(function (done) {
    var staticapp = require('express')();
    var fs = require('fs');
    staticapp.get('/fake.xml', function (req, res) {
      var file = 'NELLYVILLE SAISON 1-0018.xml'; // 'catchup-bet-example-001.xml';
      res.send(fs.readFileSync(__basedir + '/server/test/data/bet/'+file));
    });
    staticapp.get('/vtt/:filename', function (req, res) {
      res.send(fs.readFileSync(__basedir + '/server/test/data/'+req.params.filename));
    });
    staticapp.post('/jobs/*', function (req, res) {

      res.json({});
    });
    staticserver = staticapp.listen(47611, function () { done(); });

    jobsConf = config.client.jobs;
    config.client.jobs = {
      api: 'http://localhost:47611/jobs',
      basicAuth: {user: 'test', password: 'test'}
    }
  });

  // Clear users favorite episodes after testing
  after(function () {
    config.client.jobs = jobsConf;

    staticserver.close();
  });

  describe('POST /api/catchup/bet', function() {
    it('should respond 200 OK with status=success', function(done) {
      // le temps d'uploader...
      this.timeout(10000);
      //
      request(app)
        .post('/api/catchup/bet')
        .send({
          sharedSecret: "62b8557f248035275f6f8219fed7e9703d59509c",
          xml: 'http://localhost:47611/fake.xml',
          captions: [ 'http://localhost:47611/vtt/test-001.fr.vtt', 'http://localhost:47611/vtt/test-002.en.vtt' ],
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
