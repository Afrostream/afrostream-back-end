'use strict';

var Q = require('q');

var billingApi = rootRequire('/server/billing-api.js');

var AccessToken = rootRequire('/server/sqldb').AccessToken;

var getAccessToken = function (req) {
  return Q()
    .then(function () {
      var r = String(req.get('authorization')).match(/^Bearer (\w+)$/);
      if (!r || r.length !== 2) {
        throw new Error("cannot parse header");
      }
      return AccessToken.find({where: {token: r[1]}});
    })
    .then(function (accessToken) {
      return accessToken;
    }, function (err) {
      console.error('ERROR: /api/billing/#getAccessToken(): ' + err, req.headers);
      return null;
    });
};

var getClient = function (req) {
  return getAccessToken(req)
    .then(function (accessToken) {
      if (!accessToken) {
        throw new Error("missing access token");
      }
      return accessToken.getClient();
    })
    .then(function (client) {
      return client;
    }, function (err) {
      console.error('ERROR: /api/billing/#getClient(): ' + err, req.headers);
      return null;
    });
};

module.exports.showInternalplans = function (req, res) {
  // FIXME: should be refactored with #209
  // who is initiating this request ?
  getClient(req)
    .then(function (client) {
      var billingProviderName = client ? client.billingProviderName : undefined;
      return billingApi.getInternalPlans(req.user._id, billingProviderName);
    })
    .then(
      function (client) {
        res.json(client);
      },
      function (err) {
        console.error('ERROR: /api/billing/internalplans', err);
        res.status(err.statusCode || 500).send({error: String(err)});
      }
    );
};

module.exports.createSubscriptions = function (req, res) {

};