'use strict';

var _ = require('lodash');

var defaultLimit = 100;

var reqRangeToSequelizeLimit = function (req, size) {
  size = size || Infinity;

  var range;

  if (typeof req.range !== 'function') {
    console.error('missing req.range');
    return { limit: defaultLimit, offset: 0 }
  }
  range = req.range(size);
  if (range === -1 || range === -2 || !range) {
    console.error('error parsing range header' + req.get('Range'));
    return { limit: defaultLimit, offset: 0 };
  }
  // convert range to sequelize limit
  // assuming object : [ { start: 25, end: 50 }, type: 'items' ]
  if (!Array.isArray(range) || range.length < 1 ||
    parseInt(range[0].start, 10) === NaN ||
    parseInt(range[0].end, 10) === NaN) {
    console.error('unknown range result ', range);
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

module.exports.reqRangeToSequelizeLimit = reqRangeToSequelizeLimit;
module.exports.mergeReqRange = mergeReqRange;
module.exports.responseWithResultAndTotal = responseWithResultAndTotal;