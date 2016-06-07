'use strict';

var bootstrap = require('../bootstrap.js');

var app = bootstrap.getApp();
var sqldb = bootstrap.getSqldb();
var User = sqldb.User;
var Video = sqldb.Video;
var Asset = sqldb.Asset;
var Client = sqldb.Client;
var request = require('supertest');

var assert = require('better-assert');

var Q = require('q');

describe('Video API: ', function() {
  var video;
  var assets = [];

  var fakeMd5 = String(Math.round(Math.random()*1000000))+String(Math.round(Math.random()*1000000));

  // Creating a fake video + fake assets
  before(function() {
    return Video.create({
      name: "niarf.mov",
      active: true,
      importId: 0,
      drm: false,
      duration: 42,
      pfMd5Hash: fakeMd5
    }).then(function (v) {
      video = v;
      // create Assets
      return Q.all([
        Asset.create({src:"https://origin.cdn.afrostream.net/vod/soeurs_ennemies_s01ep05/d82a85af21284391.ism/d82a85af21284391.mpd", type:"application/dash+xml", videoId: video._id, active: true, importId: 0}),
        Asset.create({src:"https://origin.cdn.afrostream.net/vod/soeurs_ennemies_s01ep05/d82a85af21284391.ism/master.m3u", type:"application/vnd.apple.mpegurl", videoId: video._id, active: true, importId: 0}),
        Asset.create({src:"https://origin.cdn.afrostream.net/vod/soeurs_ennemies_s01ep05/d82a85af21284391.ism/MANIFEST", type:"application/vnd.ms-sstr+xml", videoId: video._id, active: true, importId: 0})
      ]).then(function (data) {
        assets = data;
      });
    });
  });

  var orangeNewboxClient = null;
  var orangeNewboxClientToken = null;
  before(function () {
    return Client.find({where: {type: 'legacy-api.orange-newbox'}}).then(function (c) {
      assert(c, 'client orange-newbox doesnt exist in db, please seed.');
      orangeNewboxClient = c;
      return bootstrap.getClientToken(app, orangeNewboxClient).then(function (t) {
        assert(t, 'missing client token');
        orangeNewboxClientToken = t;
      });
    });
  });
  var frontClient = null;
  var frontClientToken = null;
  before(function () {
    return Client.find({where: {type: 'front-api.front-end'}}).then(function (c) {
      assert(c, 'client front doesnt exist in db, please seed.');
      frontClient = c;
      return bootstrap.getClientToken(app, frontClient).then(function (t) {
        assert(t, 'missing client token');
        frontClientToken = t;
      });
    })
  });

  describe('calling /api/videos/:videoId with front client auth', function () {
    it('should answer 200OK without sources', function (done) {
      request(app)
        .get('/api/videos/'+video._id)
        .set('Authorization', 'Bearer ' + frontClientToken)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          if (err) return done(err);
          assert(res.body.pfMd5Hash === fakeMd5);
          assert(Array.isArray(res.body.sources));
          assert(res.body.sources.length === 0);
          done();
        });
    });
  });

  describe('calling /api/videos/:videoId with front client auth, bypassing security', function () {
    it('should answer 200OK with 3 sources', function (done) {
      request(app)
        .get('/api/videos/'+video._id)
        .query({bs: "true"})
        .set('Authorization', 'Bearer ' + frontClientToken)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          if (err) return done(err);
          assert(res.body.pfMd5Hash === fakeMd5);
          assert(Array.isArray(res.body.sources));
          assert(res.body.sources.length === 3);
          assert(res.body.sources[0].src.match(/d82a85af21284391\.ism/));
          done();
        });
    });
  });

  describe('calling /api/videos/:videoId with orange newbox client auth, bypassing security', function () {
    it('should answer 200OK with 3 sources, containing whatever-orange.ism', function (done) {
      request(app)
        .get('/api/videos/'+video._id)
        .query({bs: "true"})
        .set('Authorization', 'Bearer ' + orangeNewboxClientToken)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          if (err) return done(err);
          assert(res.body.pfMd5Hash === fakeMd5);
          assert(Array.isArray(res.body.sources));
          assert(res.body.sources.length === 3);
          assert(res.body.sources[0].src.match(/d82a85af21284391\-orange\.ism/)); // <== ORANGE ! (hack hack)
          done();
        });
    });
  });

  // cleanup
  after(function () {
    return Q.all([
      video.destroy(),
      Q.all(assets.map(function (a) { return a.destroy(); }))
    ]);
  });
});