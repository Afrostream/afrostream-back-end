'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// global
global.__basedir = __dirname + '/..';
global.rootRequire = function (name) { return require(global.__basedir + '/' + (name[0] === '/' ? name.substr(1) : name)); };

var sqldb = rootRequire('/sqldb');
var Q = require('q');

var logger = rootRequire('logger').prefix('CRON').prefix('DAILY-QUERIES');

logger.log('start');

var requireText = function (filename) {
  var fs = require('fs');
  return fs.readFileSync(__dirname + '/' + filename).toString();
};

var files = [
  './daily-queries/update-episodes-duration.sql',
  './daily-queries/update-movies-duration.sql'
];

var queries = files.map(requireText);

// logs
queries.forEach(function (q, i) {
  logger.log(i + '=' + q);
});

Q.all(
  queries.map(function (q) { return sqldb.sequelize.query(q); })
).then(function () {
  logger.log('stop');
  process.exit();
}, function (e) {
  logger.error(e.message);
  process.exit();
});
