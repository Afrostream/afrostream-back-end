'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// global
global.__basedir = __dirname + '/..';
global.rootRequire = function (name) { return require(global.__basedir + '/' + (name[0] === '/' ? name.substr(1) : name)); };

const sqldb = rootRequire('sqldb');
const Q = require('q');

const logger = rootRequire('logger').prefix('CRON').prefix('DAILY-QUERIES');

logger.log('start');

const requireText = function (filename) {
  var fs = require('fs');
  return fs.readFileSync(__dirname + '/' + filename).toString();
};

/*
 * first batch
 */
const files = [
  './daily-queries/update-episodes-duration.sql',
  './daily-queries/update-movies-duration.sql',

  './daily-queries/refresh-mview-billing_internal_plans.sql',
  './daily-queries/refresh-mview-billing_plans.sql',
  './daily-queries/refresh-mview-billing_providers.sql',
  './daily-queries/refresh-mview-billing_subscriptions.sql',
  './daily-queries/refresh-mview-billing_users_opts.sql',
  './daily-queries/refresh-mview-billing_users.sql',

  './daily-queries/refresh-mview-billing_internal_coupons_campaigns.sql',
  './daily-queries/refresh-mview-billing_internal_coupons.sql',
  './daily-queries/refresh-mview-billing_transactions.sql',
  './daily-queries/refresh-mview-billing_users_internal_coupons.sql'
];
const queries = files.map(requireText);

/*
 * 2nd batch (we need to wait for daily billing views to be refreshed
 * FIXME: order should be generic.
 */
const files2 = [
  './daily-queries/refresh-mview-unsubscribedusers.sql',
  './daily-queries/refresh-mview-subscribedusers.sql',
];
const queries2 = files2.map(requireText);

// logs
queries.forEach((q, i) => logger.log(i + '=' + q));

Q.all(
  queries.map(q => sqldb.sequelize.query(q))
)
.then(() => {
  queries2.forEach((q, i) => logger.log(i + '=' + q));

  return Q.all(
    queries2.map(q => sqldb.sequelize.query(q))
  );
})
.then(
  () => {
    logger.log('stop');
    process.exit();
  },
  e => {
    logger.error(e.message);
    process.exit();
  }
);
