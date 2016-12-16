const config = rootRequire('config');

const billingApi = rootRequire('billing-api.js');

const Q = require('q');
const request = require('request');

const maxmind = rootRequire('maxmind');

const btoa = require('btoa');

function redirectWithData(res, url, data) {
  url += '#' + btoa(JSON.stringify(data));
  res.redirect(302, url);
}

function redirectSuccess(res, url, data) {
  redirectWithData(res, url, {
    statusCode: 200,
    data: data
  });
}

function redirectError(res, url, data, statusCode) {
  redirectWithData(res, url, {
    statusCode: statusCode || 500,
    data: data
  });
}

module.exports.callback = (req, res) => {
  const logger = req.logger.prefix('WECASHUP');

  const merchantUid = config.wecashup.merchant.uid;
  const merchantPublicKey = config.wecashup.merchant.publicKey;
  const transactionUid = req.body.transaction_uid || '';

  const options =  {
    method:'GET',
    url: `https://merchant-dashboard-dot-wecashup-payment.appspot.com/api/v1.0/merchants/${merchantUid}/transactions/${transactionUid}`,
    json: true,
    qs: {
      merchant_public_key: merchantPublicKey
    },
    timeout: 10000
  };

  logger.info('=> ' + JSON.stringify(options));

  Q.nfcall(request, options)
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
  logger.info('<= '+ JSON.stringify(data));
  if (!data.response_content) {
    throw new Error('data.response_content is empty');
  }
  if (!Array.isArray(data.response_content.transactions)) {
    throw new Error('data.response_content.transactions should be an array');
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

  return billingApi.getOrCreateUser({
      providerName: config.wecashup.billingProviderName,
      userReferenceUuid: req.passport.user._id,
      userProviderUuid: undefined, //  le champs 'userProviderUuid' ne doit pas être fourni
      userOpts: {
        email: req.passport.user.get('email'),
        firstName: req.passport.user.get('first_name'),
        lastName: req.passport.user.get('last_name')
      }
    })
    .then(billingsResponse => {
      return billingApi.createSubscription({
        userBillingUuid: billingsResponse.response.user.userBillingUuid,
        internalPlanUuid: internalPlanUuid,
        subscriptionProviderUuid: undefined, // généré par le billing
        billingInfoOpts: {
          countryCode: maxmind.getCountryCode(req.clientIp)
        },
        subOpts: req.body
      });
    });
  })
  .then(
    () => {
      redirectSuccess(res, '/auth/wecashup/final-callback', {success:true});
    },
    (err) => {
      redirectError(res, '/auth/wecashup/final-callback', {success:false, error:err.message});
    }
  );
};