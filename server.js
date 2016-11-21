'use strict';

var cluster = require('express-cluster');

var clusterConf = { count: process.env.WEB_CONCURRENCY || 1, verbose: true};

cluster(worker => {
  // winston logger is not yet instanciated, fallback on console.log
  console.log('worker '+worker.id+' is up');
  return require('./worker.js');
}, clusterConf);
