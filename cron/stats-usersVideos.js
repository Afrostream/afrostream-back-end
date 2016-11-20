'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// global
global.__basedir = __dirname + '/..';
global.rootRequire = function (name) { return require(global.__basedir + '/' + (name[0] === '/' ? name.substr(1) : name)); };

var config = rootRequire('/config');
var sqldb = rootRequire('/sqldb');
var Q = require('q');

var logger = rootRequire('logger').prefix('CRON').prefix('STATS-USERSVIDEOS');

logger.log('start');

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

var baseFrontEndUrl = config.frontEnd.protocol + '://' + config.frontEnd.authority;

Q.all([
  sqldb.sequelize.query(queryTop5RatingsLast7Days),
  sqldb.sequelize.query(queryTop5ViewsLast7Days),
  sqldb.sequelize.query(queryTop5ViewsLastDay)
]).then(function (results) {
  logger.log('query done');

  // analyse query 1
  if (Array.isArray(results[0][0]) && results[0][0].length) {
    logger.log('Top 5 du contenu (rating utilisateur) sur les 7 derniers jours : #stats');
    results[0][0].filter(function (row) {
      return row && row.avgRatings && row.name && row.nbRatings;
    }).forEach(function (row) {
      var sharingUrl = baseFrontEndUrl + '/sharing/video/' + row.videoId;
      logger.log(' - Rating: ' + (Math.round(row.avgRatings* 100) / 100) + ' -> ' + row.name + ' (' + row.nbRatings + ' Users) | '+sharingUrl+' #stats');
    });
  }
  // analyse query 2
  if (Array.isArray(results[1][0]) && results[1][0].length) {
    logger.log('Top 5 des visualisations sur les 7 derniers jours : #stats');
    results[1][0].forEach(function (row) {
      var sharingUrl = baseFrontEndUrl + '/sharing/video/' + row.videoId;
      logger.log(' - ' + row.nbUsers + ' Users -> ' + row.name + ' | '+sharingUrl+' #stats');
    });
  }
  // analyse query 2
  if (Array.isArray(results[2][0]) && results[2][0].length) {
    logger.log('Top 5 des visualisations hier : #stats');
    results[2][0].forEach(function (row) {
      var sharingUrl = baseFrontEndUrl + '/sharing/video/' + row.videoId;
      logger.log(' - ' + row.nbUsers + ' Users -> ' + row.name + ' | '+sharingUrl+' #stats');
    });
  }
}).then(function () {
  logger.log('stop');
  process.exit();
}, function (e) {
  logger.error(e.message);
  process.exit();
});
