'use strict';

var _ = require('lodash');

var config = rootRequire('config');

var request = require('request');
var btoa = require('btoa');

var Q = require('q');

const logger = rootRequire('logger').prefix('JOBS');

/**
 * post a job
 *
 * default job will be retried 3 times with 60sec backoff.
 *
 * @param type string     type of job
 * @param data object     job data
 * @param options obj     job options (attempts, backoff, ...)
 * @return promise
 */
function create(type, data, options) {
  var defaultNbRetry = 3;
  var defaultBackoffDelay = 60000; //60sec
  var defaultBackoffType ='fixed';

  // log all jobs I/O
  logger.log('create:', type, data, options);
  return Q.nfcall(request, {
    uri: config.client.jobs.api +'/job',
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(config.client.jobs.basicAuth.user+':'+config.client.jobs.basicAuth.password)
    },
    body: {
      type: type,
      data: data,
      options: _.merge({
        attempts: defaultNbRetry,
        backoff: {
          delay: defaultBackoffDelay,
          type: defaultBackoffType
        }
      }, options || {})
    },
    json: true
  })
    .then(function (result) {
      var response = result[0], body = result[1];
      if (response.statusCode !== 200) {
        throw "status="+response.statusCode+", body="+body;
      }
      return body;
    })
    .then(function success(result) { logger.log('create: OK', result[1]); return result; },
          function error(err) { logger.error('create: error=', err); throw err; });
}

module.exports.create = create;
