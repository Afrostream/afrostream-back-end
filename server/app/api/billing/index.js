'use strict';

/**
 * @api {get} /api/billings/internalplans List plans
 * @apiName GetBillingInternalplans
 * @apiGroup Billing
 *
 * @apiError (500) {String} error message
 * @apiErrorExample {json} Error-Response:
 *   HTTP/1.1 500 Internal server error
 *   {
 *     "error": "whatever"
 *   }
 * @apiSuccessExample {json} Success-Response:
 *   HTTP/1.1 200 OK
    [
        {
          internalPlanUuid: "bachat-afrostreammonthly",
          name: "Mensuel",
          description: "Mensuel",
          amountInCents: "699",
          amountInCentsExclTax: "559",
          vatRate: "20",
          currency: "EUR",
          cycle: "auto",
          periodUnit: "day",
          periodLength: "30",
          internalPlanOpts: {
            promoEnabled: "true",
            promoItemBasePrice: "0",
            promoItemTaxAmount: "20",
            promoItemTotal: "0",
            promoCurrency: "EUR",
            promoPeriod: "30",
            promoDuration: "0"
          },
          providerPlans: {
            bachat: {
              providerPlanUuid: "bachat-afrostreammonthly",
              name: "bachat-afrostreammonthly",
              description: "bachat-afrostreammonthly",
              provider: {
                providerName: "bachat"
              }
            }
          }
        },
        {
          internalPlanUuid: "bachat-afrostreamdaily",
          name: "Jour",
          description: "Jour",
          amountInCents: "199",
          amountInCentsExclTax: "159",
          vatRate: "20",
          currency: "EUR",
          cycle: "auto",
          periodUnit: "day",
          periodLength: "1",
          internalPlanOpts: {
            promoEnabled: "false",
            promoItemBasePrice: "0",
            promoItemTaxAmount: "20",
            promoItemTotal: "0",
            promoCurrency: "EUR",
            promoPeriod: "1",
            promoDuration: "0"
          },
          providerPlans: {
            bachat: {
              providerPlanUuid: "bachat-afrostreamdaily",
              name: "bachat-afrostreamdaily",
              description: "bachat-afrostreamdaily",
              provider: {
                providerName: "bachat"
              }
            }
          }
        }
      ]
 */

/**
 * @api {post} /api/billings/subscriptions Create a subscription
 * @apiName CreateBillingSubscription
 * @apiGroup Billing
 *
 * @apiParam (postData) {String} firstName (optional)
 * @apiParam (postData) {String} lastName (optional)
 * @apiParam (postData) {String} internalPlanUuid from /api/billings/internalplans
 * @apiParam (postData) {String} subscriptionProviderUuid ex: bouygues subscription id
 *
 * @apiSuccessExample {json} Success-Response:
 *   HTTP/1.1 200 OK
   {
      name: 'toto',
      role: 'user',
      _id: 42,
      email: 'test.integration+billing@afrostream.tv',
      provider: null,
      facebook: null,
      bouyguesId: '42424242',
      planCode: 'bachat-afrostreamdaily'
   }
 *
 * @apiError (500) {String} error message
 * @apiErrorExample {json} Error-Response:
 *   HTTP/1.1 500 Internal server error
 *   {
 *     "error": "whatever"
 *   }
 */


var express = require('express');
var controller = require('./billing.controller.js');
var auth = rootRequire('/server/auth/auth.service');

var router = express.Router();

router.get('/internalplans', auth.isAuthenticated(), controller.showInternalplans);
router.post('/subscriptions', auth.isAuthenticated(), controller.createSubscriptions);

module.exports = router;
