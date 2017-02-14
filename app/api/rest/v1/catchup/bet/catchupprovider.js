'use strict';

const sqldb = rootRequire('sqldb');
const CatchupProvider = sqldb.CatchupProvider;

const config = rootRequire('config');

const getCatchupProviderInfos = catchupProviderId => CatchupProvider.find({where: { _id: catchupProviderId } })
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
