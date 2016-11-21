module.exports = function (options) {
  var id = 0;

  options = options || {};
  return function (req, res, next) {
    req.id = id++;
    if (options.headerReqId) {
      res.set('Req-Id', req.id);
    }
    next();
  };
};
