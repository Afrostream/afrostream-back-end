'use strict';

var Q = require('q');

var createJob = require('./job.generic.js').create;

/**
 * default job configuration : 10 attempts, backoff of 5 min
 * @param data object { xml: ..., mamId: ..., caption: [ string, string ] }
 * @return Promise
 */
var create = function (data) {
  return createJob(
    'catchup-bet',
    data,
    {
      attempts:10,
      backoff: {
        delay: 5 * 60 * 1000, // 5 min
        type: 'fixed'
      }
    }
  );
};

module.exports.create = create;