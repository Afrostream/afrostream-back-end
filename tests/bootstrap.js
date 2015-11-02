'use strict';

before(function () {
  var User = require('../server/sqldb').User;
  // ensure user test@test.com / test exist.
  // create a new test user at each session.
  return User.destroy({where: {email:'test@test.com'}}).then(function () {
    var user = User.build({
      name: 'Test User',
      email: 'test@test.com',
      password: 'test'
    });
    return user.save();
  });
});

process.on('uncaughtException', function(err) {
  console.error('Caught exception: ' + err);
});

module.exports.getApp = function () {
  return require('../server/app.js');
};

module.exports.getSqldb = function () {
  return require('../server/sqldb');
};

module.exports.getTestUser = function () {
  var User = require('../server/sqldb').User;

  return User.find({ where: { email: 'test@test.com' } })
    .then(function (user) {
      if (!user) throw "missing user test@test.com in database.";
      return user;
    });
};

module.exports.getTestClient = function () {
  var Client = require('../server/sqldb').Client;

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
      password: 'test'
    })
    .expect(200)
    .expect('Content-Type', /json/);
  var f = bluebird.promisify(r.end, r);
  return f().then(function (res) {
    console.log('token='+res.body.token);
    var token = res.body.token;
    return token;
  })
};

module.exports.getRandomMovie = function (app) {
  var Movie = require('../server/sqldb').Movie;

  return Movie.find({ where: { title: { $iLike : '%random%' }, active: true }})
    .then(function (movie) {
      if (!movie) throw "missing random active movie in the database.";
      return movie;
    });
};

module.exports.getRandomInactiveMovie = function (app) {
  var Movie = require('../server/sqldb').Movie;

  return Movie.find({ where: { title: { $iLike : '%random%' }, active: false }})
    .then(function (movie) {
      if (!movie) throw "missing random inactive movie in the database.";
      return movie;
    });
};

module.exports.getRandomSeason = function (app) {
  var Season = require('../server/sqldb').Season;

  return Season.find({ where: { title: { $iLike : '%random%' }, active: true }})
    .then(function (season) {
      if (!season) throw "missing random active season in the database.";
      return season;
    });
};

module.exports.getRandomInactiveSeason = function (app) {
  var Season = require('../server/sqldb').Season;

  return Season.find({ where: { title: { $iLike : '%random%' }, active: false }})
    .then(function (season) {
      if (!season) throw "missing random inactive season in the database.";
      return season;
    });
};

module.exports.getRandomEpisode = function (app) {
  var Episode = require('../server/sqldb').Episode;

  return Episode.find({ where: { title: { $iLike : '%random%' }, active: true }})
    .then(function (epispode) {
      if (!epispode) throw "missing random active epispode in the database.";
      return epispode;
    });
};

module.exports.getRandomInactiveEpisode = function (app) {
  var Episode = require('../server/sqldb').Episode;

  return Episode.find({ where: { title: { $iLike : '%random%' }, active: false }})
    .then(function (epispode) {
      if (!epispode) throw "missing random inactive epispode in the database.";
      return epispode;
    });
};