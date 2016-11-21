'use strict';

var sqldb = rootRequire('sqldb');
var CatchupProvider = sqldb.CatchupProvider;

var config = rootRequire('config');

var getCatchupProviderInfos = catchupProviderId => CatchupProvider.find({where: { _id: catchupProviderId } })
  .then(catchupProvider => {
    if (catchupProvider) {
      return catchupProvider.dataValues;
    } else {
      return {
        _id: config.catchup.bet.catchupProviderId,
        expiration: config.catchup.bet.defaultExpiration
      };
    }
  });

module.exports.getInfos = getCatchupProviderInfos;
