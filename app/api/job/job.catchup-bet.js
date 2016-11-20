'use strict';

var createJob = require('./job.generic.js').create;

/**
 * default job configuration : 27 attempts, backoff of 20 min (~= 9h of retry)
 * @param data object { xml: ..., pfContentId: ..., caption: [ string, string ] }
 * @return Promise
 */
var create = function (data) {
  return createJob(
    'catchup-bet',
    data,
    {
      attempts: 27, // 9h
      backoff: {
        delay: 20 * 60 * 1000, // 20 min
        type: 'fixed'
      }
    }
  );
};

module.exports.create = create;
