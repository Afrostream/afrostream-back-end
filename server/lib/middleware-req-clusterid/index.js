'use strict';

var cluster = require('cluster');

module.exports = function () {
  var clusterId = cluster.isMaster ? 'master' : 'worker-' + cluster.worker.id;
  return function (req, res, next) {
    req.clusterId = clusterId;
    next();
  };
};