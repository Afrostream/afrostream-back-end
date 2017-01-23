const config = rootRequire('config');

const billingApi = rootRequire('billing-api.js');

const Q = require('q');
const request = require('request');

const maxmind = rootRequire('maxmind');

const btoa = require('btoa');

const User = rootRequire('sqldb').User;

function redirectWithData (res, url, data) {
  url += '#' + btoa(JSON.stringify(data));
  res.redirect(302, url);
}

function redirectSuccess (res, url, data) {
  redirectWithData(res, url, {
    statusCode: 200,
    data: data
  });
}

function redirectError (res, url, data, statusCode) {
  redirectWithData(res, url, {
    statusCode: statusCode || 500,
    data: data
  });
}

module.exports.check = (req, res) => {
  return Q()
    .then(() => {
        if (!req.passport) {
          const error = new Error('missing passport');
          error.statusCode = 401;
          throw error;
        }
        if (!req.passport.user) {
          const error = new Error('unauthentified user');
          error.statusCode = 401;
          throw error;
        }
        res.cookie(
          config.cookies.wecashup.name,
          {
            userId: req.passport.user._id,
            firstName: req.query.firstName,
            lastName: req.query.lastName
          },
          {
            domain: config.cookies.wecashup.domain,
            path: '/',
            signed: true
          }
        );
      }
    )
    .then(
      () => {
        res.json({});
      },
      res.handleError()
    );
};

module.exports.callback = (req, res) => {
  const logger = req.logger.prefix('WECASHUP');
  const signedCokkie = req.signedCookies[config.cookies.wecashup.name];
  return Q()
    .then(() => {
      if (!req.signedCookies) {
        throw new Error('no cookies');
      }
      if (!signedCokkie) {
        throw new Error('missing cookie wecashup');
      }
      if (!signedCokkie.userId) {
        throw new Error('missing userId');
      }
      return User.find({where: {_id: signedCokkie.userId}});
    })
    .then(user => {
      const merchantUid = config.wecashup.merchant.uid;
      const merchantPublicKey = config.wecashup.merchant.publicKey;
      const merchantSecret = config.wecashup.merchant.secret;
      const transactionUid = req.body.transaction_uid || '';

      const options = {
        method: 'GET',
        url: `https://www.wecashup.com/api/v1.0/merchants/${merchantUid}/transactions/${transactionUid}`,
        json: true,
        qs: {
          merchant_public_key: merchantPublicKey,
          merchant_secret: merchantSecret
        },
        timeout: 30000
      };

      logger.log('=> ' + JSON.stringify(options));

      return Q.nfcall(request, options)
        .then(([response, data]) => {
          // error checking :)
          if (!response) {
            throw new Error('no response');
          }
          if (response.statusCode !== 200) {
            logger.error(`statusCode = ${response.statusCode}`);
            throw new Error('wecashup should response 200ok');
          }
          if (!data) {
            throw new Error('no data');
          }
          logger.log('<= ' + JSON.stringify(data));
          if (!data.response_content) {
            throw new Error('data.response_content is empty');
          }
          if (!Array.isArray(data.response_content.transactions)) {
            throw new Error('data.response_content.transactions should be an array');
          }
          if (!data.response_content.transactions.length) {
            throw new Error('data.response_content.transactions should not be empty');
          }
          if (data.response_content.transactions.length > 1) {
            logger.warn('multiple transactions');
          }
          if (!data.response_content.transactions[0].transaction_sender_reference) {
            throw new Error('cannot extract transaction_sender_reference');
          }
          const internalPlanUuid = data.response_content.transactions[0].transaction_sender_reference;

          return billingApi.getOrCreateUser(req, {
            providerName: config.wecashup.billingProviderName,
            userReferenceUuid: user._id,
            userProviderUuid: undefined, //  le champs 'userProviderUuid' ne doit pas être fourni
            userOpts: {
              email: user.get('email'),
              firstName: signedCokkie.firstName || user.get('first_name'),
              lastName: signedCokkie.lastName || user.get('last_name')
            }
          }).then(billingsResponse => {
            return billingApi.createSubscription(req, {
              userBillingUuid: billingsResponse.response.user.userBillingUuid,
              internalPlanUuid: internalPlanUuid,
              subscriptionProviderUuid: undefined, // généré par le billing
              billingInfo: {
                countryCode: maxmind.getCountryCode(req.clientIp)
              },
              subOpts: req.body
            });
          });
        });
    }).then(
      (data) => {
        logger.log('SUCCESS => ' + JSON.stringify(data));
        redirectSuccess(res, '/auth/wecashup/final-callback', {success: true});
      },
      (err) => {
        logger.warn(err.message);
        redirectError(res, '/auth/wecashup/final-callback', {success: false, error: err.message});
      }
    );
};
