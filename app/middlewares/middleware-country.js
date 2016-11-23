var Country = rootRequire('sqldb').Country;

module.exports = function (options) {
  options = options || {};
  options.logger = options.logger || console;

  return function (req, res, next) {
    /**
     * Default country is "unknown" <=> "--"
     *  But some broadcasters have a default country, ex: Orange newbox/Orange Mib4/Bouygues miami => FR
     */
    var country = req.query.country || req.broadcaster && req.broadcaster.defaultCountryId || "--";
    if (country === '--') {
      (req.logger || options.logger).debug('[MIDDLEWARE-COUNTRY]: unknown country req.country=' +
                                            req.country+' broadcasterId='+(req.broadcaster&&req.broadcaster._id) +
                                            ' url='+ req.originalUrl);
    }
    Country.findOne({where: { _id: country }})
      .then(function (country) {
        if (!country) {
          throw new Error('no country ' + req.query.country);
        }
        req.country = country;
      })
      .then(
        function success() { next(); },
        function error(err) {
        req.country = null;
        (req.logger || options.logger).error('[MIDDLEWARE-COUNTRY]: cannot find country ' + err.message);
        next();
      });
  };
};
