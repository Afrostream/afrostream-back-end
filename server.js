'use strict';

var cluster = require('express-cluster');

// FIXME: we need to look at the code to see if
//  back-end is "cluster" friendly
// ex: @see express session & passport.
// temporary disabling cluster of multiple workers
var clusterConf = {count: 1 /*process.env.WEB_CONCURRENCY || 1 */, verbose: true};

cluster(function (worker) {
  console.log('worker '+worker.id+' is up');
  return require('./server/index.js');
}, clusterConf);
