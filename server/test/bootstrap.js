'use strict';

process.env.NODE_ENV = 'test';

// global
global.__basedir = __dirname + '/../..';
global.rootRequire = function (name) { return require(global.__basedir + '/' + (name[0] === '/' ? name.substr(1) : name)); };

var config = rootRequire('/server/config');

if (config.env !== 'test') {
  console.error('test should only be run on test env');
  process.exit(0);
}

before(function () {
  var User = rootRequire('/server/sqldb').User;
  // ensure user test@test.com / test exist.
  // create a new test user at each session.
  return User.destroy({where: {email:'test@test.com'}}).then(function () {
    var user = User.build({
      name: 'Test User',
      email: 'test@test.com',
      password: '123456'
    });
    return user.save();
  });
});

process.on('uncaughtException', function(err) {
  console.error('Caught exception: ' + err);
});

module.exports.getApp = function () {
  return rootRequire('/server/app/app.js');
};

module.exports.getSqldb = function () {
  return rootRequire('/server/sqldb');
};

module.exports.getTestUser = function () {
  var User = rootRequire('/server/sqldb').User;

  return User.find({ where: { email: 'test@test.com' } })
    .then(function (user) {
      if (!user) throw "missing user test@test.com in database.";
      return user;
    });
};

module.exports.getTestClient = function () {
  var Client = rootRequire('/server/sqldb').Client;

  return Client.find({ where: { role: 'client' }})
    .then(function (client) {
      if (!client) throw "missing client with role 'client' in database.";
      return client;
    });
};

module.exports.getToken = function (app) {
  var request = require('supertest');
  var bluebird = require('bluebird');

  var r = request(app)
    .post('/auth/local')
    .send({
      email: 'test@test.com',
      password: '123456'
    })
    .expect(200)
    .expect('Content-Type', /json/);
  var f = bluebird.promisify(r.end, r);
  return f().then(function (res) {
    var token = res.body.token;
    return token;
  }, function (err) {
    console.error(err);
    throw err;
  })
};

module.exports.getRandomMovie = function (app) {
  var Movie = rootRequire('/server/sqldb').Movie;
  var Video = rootRequire('/server/sqldb').Video;

  return Movie.find({ where: { title: { $iLike : '%random%' } , active: true }
                    , include: [ { model: Video, as: 'video', active: true } ] })
    .then(function (movie) {
      if (!movie) throw "missing random active movie in the database.";
      return movie;
    });
};

module.exports.getRandomInactiveMovie = function (app) {
  var Movie = rootRequire('/server/sqldb').Movie;

  return Movie.find({ where: { title: { $iLike : '%random%' }, active: false }})
    .then(function (movie) {
      if (!movie) throw "missing random inactive movie in the database.";
      return movie;
    });
};

module.exports.getRandomSeason = function (app) {
  var Season = rootRequire('/server/sqldb').Season;

  return Season.find({ where: { title: { $iLike : '%random%' }, active: true }})
    .then(function (season) {
      if (!season) throw "missing random active season in the database.";
      return season;
    });
};

module.exports.getRandomInactiveSeason = function (app) {
  var Season = rootRequire('/server/sqldb').Season;

  return Season.find({ where: { title: { $iLike : '%random%' }, active: false }})
    .then(function (season) {
      if (!season) throw "missing random inactive season in the database.";
      return season;
    });
};

module.exports.getRandomEpisode = function (app) {
  var Episode = rootRequire('/server/sqldb').Episode;

  return Episode.find({ where: { title: { $iLike : '%random%' }, active: true }})
    .then(function (epispode) {
      if (!epispode) throw "missing random active epispode in the database.";
      return epispode;
    });
};

module.exports.getRandomInactiveEpisode = function (app) {
  var Episode = rootRequire('/server/sqldb').Episode;

  return Episode.find({ where: { title: { $iLike : '%random%' }, active: false }})
    .then(function (epispode) {
      if (!epispode) throw "missing random inactive epispode in the database.";
      return epispode;
    });
};