'use strict';

var cluster = require('express-cluster');

var clusterConf = {count: process.env.WEB_CONCURRENCY || 1, verbose: true};

cluster(function (worker) {
  console.log('worker '+worker.id+' is up');
  return require('./server/index.js');
}, clusterConf);
