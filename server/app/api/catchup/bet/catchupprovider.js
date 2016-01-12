'use strict';

var sqldb = rootRequire('/server/sqldb');
var CatchupProvider = sqldb.CatchupProvider;

var config = rootRequire('/server/config');

var getCatchupProviderInfos = function (catchupProviderId) {
  return CatchupProvider.find({where: { _id: catchupProviderId } })
    .then(function (catchupProvider) {
      if (catchupProvider) {
        return catchupProvider.dataValues;
      } else {
        return {
          _id: config.catchup.bet.catchupProviderId,
          expiration: config.catchup.bet.defaultExpiration
        }
      }
    });
};

module.exports.getInfos = getCatchupProviderInfos;