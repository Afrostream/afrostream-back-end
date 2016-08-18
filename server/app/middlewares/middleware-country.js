var Q = require('q');

var Country = rootRequire('/server/sqldb').Country;

module.exports = function (options) {
  return function (req, res, next) {
    Country.findOne({where: { _id: req.query.country || "FR" }})
      .then(function (country) {
        if (!country) {
          throw new Error('no country ' + req.query.country);
        }
        req.country = country;
        next();
      }, function (err) {
        req.country = null;
        console.error('[ERROR]: [MIDDLEWARE-COUNTRY]: cannot find country ' + err.message);
        next();
      });
  }
}
