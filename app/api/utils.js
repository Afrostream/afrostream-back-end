'use strict';

var _ = require('lodash');

// should be 10
// but the auto-complete require to query in 200 episodes ...
var defaultLimit = 500;

var reqRangeToSequelizeLimit = function (req, size) {
  size = size || Infinity;

  var range;

  if (typeof req.range !== 'function') {
    req.logger.error('missing req.range');
    return { limit: defaultLimit, offset: 0 };
  }
  range = req.range(size);
  if (range === -1 || range === -2 || !range) {
    req.logger.error('parsing range header' + req.get('Range'));
    return { limit: defaultLimit, offset: 0 };
  }
  // convert range to sequelize limit
  // assuming object : [ { start: 25, end: 50 }, type: 'items' ]
  if (!Array.isArray(range) || range.length < 1 ||
    isNaN(parseInt(range[0].start, 10)) ||
    isNaN(parseInt(range[0].end, 10))) {
    req.logger.error('unknown range result ', range);
    return { limit: defaultLimit, offset: 0 };
  }
  return { offset: range[0].start, limit: range[0].end - range[0].start };
};

var mergeReqRange = function (obj, req, size) {
  return _.merge(obj, reqRangeToSequelizeLimit(req, size));
};

var responseWithResultAndTotal = function (res, statusCode) {
  statusCode = statusCode || 200;
  return function (entity) {
    if (entity) {
      res.set('Resource-Count', entity.count);
      res.status(statusCode).json(entity.rows);
    }
  };
};

function handleEntityNotFound() {
  return function (entity) {
    if (!entity) {
      var error = new Error("entity not found");
      error.statusCode = 404;
      throw error;
    }
    return entity;
  };
}

var middlewareCache = function (req, res, next) {
   res.cache();
   next();
};

var middlewareNoCache = function (req, res, next) {
  res.noCache();
  next();
};

/**
 * Tels if the request provider is the backoffice GUI.
 * @param req
 * @returns {*}
 */
function isReqFromAfrostreamAdmin (req) {
  return req.passport && req.passport.client && req.passport.client.isAfrostreamAdmin();
}

// middlewares
module.exports.middlewareCache = middlewareCache;
module.exports.middlewareNoCache = middlewareNoCache;
module.exports.reqRangeToSequelizeLimit = reqRangeToSequelizeLimit;
module.exports.mergeReqRange = mergeReqRange;
module.exports.responseWithResultAndTotal = responseWithResultAndTotal;
module.exports.handleEntityNotFound = handleEntityNotFound;
module.exports.isReqFromAfrostreamAdmin = isReqFromAfrostreamAdmin;
