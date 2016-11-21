'use strict';

const _ = require('lodash');

// should be 10
// but the auto-complete require to query in 200 episodes ...
const defaultLimit = 500;

const reqRangeToSequelizeLimit = (req, size) => {
  size = size || Infinity;

  let range;

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

const mergeReqRange = (obj, req, size) => _.merge(obj, reqRangeToSequelizeLimit(req, size));

const responseWithResultAndTotal = (res, statusCode) => {
  statusCode = statusCode || 200;
  return entity => {
    if (entity) {
      res.set('Resource-Count', entity.count);
      res.status(statusCode).json(entity.rows);
    }
  };
};

function handleEntityNotFound() {
  return entity => {
    if (!entity) {
      const error = new Error("entity not found");
      error.statusCode = 404;
      throw error;
    }
    return entity;
  };
}

const middlewareCache = (req, res, next) => {
   res.cache();
   next();
};

const middlewareNoCache = (req, res, next) => {
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
