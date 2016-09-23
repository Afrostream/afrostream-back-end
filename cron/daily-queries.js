'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// global
global.__basedir = __dirname + '/../..';
global.rootRequire = function (name) { return require(global.__basedir + '/' + (name[0] === '/' ? name.substr(1) : name)); };

var config = rootRequire('/config');
var sqldb = rootRequire('/sqldb');
var Q = require('q');

console.log('[INFO]: [CRON]: daily-queries start');

var requireText = function (filename) {
  var fs = require('fs');
  return fs.readFileSync(__dirname + '/' + filename).toString();
};

var files = [
  './daily-queries/update-episodes-duration.sql',
  './daily-queries/update-movies-duration.sql'
]

var queries = files.map(requireText);

// logs
queries.forEach(function (q, i) {
  console.log('[INFO]: [CRON]: query ' + i + '=' + q);
});

Q.all(
  queries.map(function (q) { return sqldb.sequelize.query(q); })
).then(function (result) {
  console.log('[INFO]: [CRON]: daily-queries stop');
  process.exit();
}, function (e) {
  console.error('[ERROR]: [CRON]: daily-queries ' + e, e);
  process.exit();
});
