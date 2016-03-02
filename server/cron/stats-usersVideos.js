'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// global
global.__basedir = __dirname + '/../..';
global.rootRequire = function (name) { return require(global.__basedir + '/' + (name[0] === '/' ? name.substr(1) : name)); };

var config = require('../config');
var sqldb = require('../sqldb');

var _ = require('lodash');
var Q = require('q');

console.log('[INFO]: [CRON]: stats-usersVideos start');

var requireText = function (filename) {
  var fs = require('fs');
  return fs.readFileSync(__dirname + '/' + filename).toString();
};

var moment = require('moment');
var last7DaysFrom = moment().subtract(7, 'days').startOf('day').toISOString();
var last7DaysTo = moment().subtract(1, 'days').endOf('day').toISOString();
var yesterdayFrom = moment().subtract(1, 'days').startOf('day').toISOString();
var yesterdayTo = moment().subtract(1, 'days').endOf('day').toISOString();

// 5 top rated from last 7 days
var queryTop5Ratings = requireText('./stats-usersVideos/query-top-5-ratings.sql');
var queryTop5RatingsLast7Days = queryTop5Ratings
  .replace('{{dateLastReadFrom}}', last7DaysFrom)
  .replace('{{dateLastReadTo}}', last7DaysTo);
var queryTop5Views = requireText('./stats-usersVideos/query-top-5-views.sql');
var queryTop5ViewsLast7Days = queryTop5Views
  .replace('{{dateLastReadFrom}}', last7DaysFrom)
  .replace('{{dateLastReadTo}}', last7DaysTo);
var queryTop5ViewsLastDay = queryTop5Views
  .replace('{{dateLastReadFrom}}', yesterdayFrom)
  .replace('{{dateLastReadTo}}', yesterdayTo);

Q.all([
  sqldb.sequelize.query(queryTop5RatingsLast7Days),
  sqldb.sequelize.query(queryTop5ViewsLast7Days),
  sqldb.sequelize.query(queryTop5ViewsLastDay)
]).then(function (results) {
  console.log('[INFO]: [CRON]: stats-usersVideos query done');

  var text;
  // analyse query 1
  if (Array.isArray(results[0][0]) && results[0][0].length) {
    text = results[0][0].filter(function (row) {
      return row && row.avgRatings && row.name && row.nbRatings
    }).reduce(function (text, row) {
      return text + 'Rating moyen: ' + _.round(row.avgRatings, 2) + ' -> ' + row.name + ' (' + row.nbRatings + ' utilisateurs)' + "\n";
    }, '');
    console.log('#content Top 5 du contenu (rating utilisateur) sur les 7 derniers jours :' + "\n" + text);
  }
  // analyse query 2
  if (Array.isArray(results[1][0]) && results[1][0].length) {
    text = results[1][0].reduce(function (text, row) {
      console.log(row);
      return text + 'Nombre d\'utilisateurs: ' + row.nbUsers + ' -> ' + row.name + "\n";
    }, '');
    console.log('#content Top 5 des visualisations sur les 7 derniers jours :' + "\n" + text);
  }
  // analyse query 2
  if (Array.isArray(results[2][0]) && results[2][0].length) {
    text = results[2][0].reduce(function (text, row) {
      return text + 'Nombre d\'utilisateurs: ' + row.nbUsers + ' -> ' + row.name + "\n";
    }, '');
    console.log('#content Top 5 des visualisations hier :' + "\n" + text);
  }
}).then(function () {
  console.log('[INFO]: [CRON]: stats-usersVideos stop');
  process.exit();
}, function (e) {
  console.error('[ERROR]: [CRON]: stats-usersVideos ' + e, e);
  process.exit();
});
