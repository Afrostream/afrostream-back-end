'use strict';

var Q = require('q');

var createJob = require('./job.generic.js').create;

/**
 * default job configuration : 18 attempts, backoff of 10 min (~= 3h of retry)
 * @param data object { xml: ..., mamId: ..., caption: [ string, string ] }
 * @return Promise
 */
var create = function (data) {
  return createJob(
    'catchup-bet',
    data,
    {
      attempts: 18, // 3h
      backoff: {
        delay: 10 * 60 * 1000, // 10 min
        type: 'fixed'
      }
    }
  );
};

module.exports.create = create;