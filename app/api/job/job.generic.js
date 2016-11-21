'use strict';

const _ = require('lodash');

const config = rootRequire('config');

const request = require('request');
const btoa = require('btoa');

const Q = require('q');

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
  const defaultNbRetry = 3;
  const defaultBackoffDelay = 60000; //60sec
  const defaultBackoffType ='fixed';

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
    .then(result => {
      const response = result[0], body = result[1];
      if (response.statusCode !== 200) {
        throw "status="+response.statusCode+", body="+body;
      }
      return body;
    })
    .then(function success(result) { logger.log('create: OK', result[1]); return result; },
          function error(err) { logger.error('create: error=', err); throw err; });
}

module.exports.create = create;
