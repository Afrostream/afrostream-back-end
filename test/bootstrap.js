'use strict';

process.env.NODE_ENV = 'test';

var Q = require('q');

if (process.version.substr(0, 3) !== 'v6.') {
  console.error('[ERROR]: please: nvm use 0.12');
  process.exit(1);
}

// global
global.__basedir = __dirname + '/..';
global.rootRequire = function (name) { return require(global.__basedir + '/' + (name[0] === '/' ? name.substr(1) : name)); };

var config = rootRequire('config');

if (config.env !== 'test') {
  console.error('test should only be run on test env');
  process.exit(0);
}

before(function () {
  var User = rootRequire('sqldb').User;
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
  return rootRequire('app/app.js');
};

module.exports.getSqldb = function () {
  return rootRequire('sqldb');
};

module.exports.getTestUser = function () {
  var User = rootRequire('sqldb').User;

  return User.find({ where: { email: 'test@test.com' } })
    .then(function (user) {
      if (!user) throw "missing user test@test.com in database.";
      return user;
    });
};

module.exports.getTestClient = function () {
  var Client = rootRequire('sqldb').Client;

  return Client.find({ where: { role: 'client' }})
    .then(function (client) {
      if (!client) throw "missing client with role 'client' in database.";
      return client;
    });
};

module.exports.getToken = function (app) {
  var request = require('supertest');

  var deferred = Q.defer();
  request(app)
    .post('/auth/local')
    .send({
      email: 'test@test.com',
      password: '123456'
    })
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function (err, response) {
      if (err) {
        console.error(err);
        deferred.reject(err);
      } else {
        deferred.resolve(response.body.token);
      }
    });
  return deferred.promise;
};

module.exports.getClientToken = function (app, client) {
  var request = require('supertest');

  var deferred = Q.defer();
  request(app)
    .post('/auth/oauth2/token')
    .send({
      grant_type: 'client_credentials',
      client_id: client.get('_id'),
      client_secret: client.get('secret')
    })
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function (err, response) {
      if (err) {
        console.error(err);
        deferred.reject(err);
      } else {
        deferred.resolve(response.body.access_token);
      }
    });
  return deferred.promise;
};

module.exports.getRandomMovie = function (app) {
  var Movie = rootRequire('sqldb').Movie;
  var Video = rootRequire('sqldb').Video;

  return Movie.find({ where: { title: { $iLike : '%random%' } , active: true }
                    , include: [ { model: Video, as: 'video', active: true } ] })
    .then(function (movie) {
      if (!movie) throw "missing random active movie in the database.";
      return movie;
    });
};

module.exports.getRandomInactiveMovie = function (app) {
  var Movie = rootRequire('sqldb').Movie;

  return Movie.find({ where: { title: { $iLike : '%random%' }, active: false }})
    .then(function (movie) {
      if (!movie) throw "missing random inactive movie in the database.";
      return movie;
    });
};

module.exports.getRandomSeason = function (app) {
  var Season = rootRequire('sqldb').Season;

  return Season.find({ where: { title: { $iLike : '%random%' }, active: true }})
    .then(function (season) {
      if (!season) throw "missing random active season in the database.";
      return season;
    });
};

module.exports.getRandomInactiveSeason = function (app) {
  var Season = rootRequire('sqldb').Season;

  return Season.find({ where: { title: { $iLike : '%random%' }, active: false }})
    .then(function (season) {
      if (!season) throw "missing random inactive season in the database.";
      return season;
    });
};

module.exports.getRandomEpisode = function (app) {
  var Episode = rootRequire('sqldb').Episode;

  return Episode.find({ where: { title: { $iLike : '%random%' }, active: true }})
    .then(function (epispode) {
      if (!epispode) throw "missing random active epispode in the database.";
      return epispode;
    });
};

module.exports.getRandomInactiveEpisode = function (app) {
  var Episode = rootRequire('sqldb').Episode;

  return Episode.find({ where: { title: { $iLike : '%random%' }, active: false }})
    .then(function (epispode) {
      if (!epispode) throw "missing random inactive epispode in the database.";
      return epispode;
    });
};
