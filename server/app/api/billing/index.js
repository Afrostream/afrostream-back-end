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
 * @apiParam (postData) {Object} subOpts
 * @apiParamExample {json} subOpts
 *  {
 *      "requestId": "requestIdValue",
 *      "promoEnabled": "false",
 *      "promoItemBasePrice": "0",
 *      "promoItemTaxAmount": "20",
 *      "promoItemTotal": "0",
 *      "promoCurrency": "EUR",
 *      "promoPeriod": "1",
 *      "promoDuration": "0"
 *   }
 *
 * @apiSuccessExample {json} Success-Response:
 *   HTTP/1.1 200 OK
 {
    "subscriptionBillingUuid": "SubscriptionBillingUUID",
    "subscriptionProviderUuid": "SubscriptionProviderUUID",
    "isActive": "yes",
    "user": {
      "userBillingUuid": "UserBillingUUID",
      "userReferenceUuid": "afrostreamUUID",
      "userProviderUuid": "UserProviderUUID",
      "provider": {
        "providerName": "bachat"
      },
      "userOpts": {
        "email": "email@domain.com",
        "firstName": "myFirstName",
        "lastName": "myLastName"
      }
    },
    "provider": {
      "providerName": "bachat"
    },
    "internalPlan": {
      "internalPlanUuid": "bachat-afrostreamdaily",
      "name": "bachat-afrostreamdaily",
      "description": "bachat-afrostreamdaily",
      "amountInCents": "199",
      "amountInCentsExclTax": "159",
      "vatRate": "20,00",
      "currency": "EUR",
      "cycle": "auto",
      "periodUnit": "day",
      "periodLength": "1",
      "internalPlanOpts": {
      "promoEnabled": "false",
      "promoItemBasePrice": "0",
      "promoItemTaxAmount": "20",
      "promoItemTotal": "0",
      "promoCurrency": "EUR",
      "promoPeriod": "1",
      "promoDuration": "0"
    },
    "thumb": {
      "path": "/staging/billings/afrolover.jpg",
        "imgix": "https://afrostream.imgix.net/staging/billings/afrolover.jpg"
    }
  },
  "creationDate": "2015-12-25 12:00:00+00",
  "updatedDate": "2015-12-25 12:00:00+00",
  "subStatus": "active",
  "subActivatedDate": "2015-12-25 12:00:00+00",
  "subCanceledDate": null,
  "subExpiresDate": null,
  "subPeriodStartedDate": "2015-12-25 12:00:00+00",
  "subPeriodEndsDate": "2016-01-25 12:00:00+00",
  "subOpts": {
  "requestId": "requestIdValue",
    "promoEnabled": "false",
    "promoItemBasePrice": "0",
    "promoItemTaxAmount": "20",
    "promoItemTotal": "0",
    "promoCurrency": "EUR",
    "promoPeriod": "1",
    "promoDuration": "0"
  }
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

// all billing routes cannot be cached.
router.use(function (req, res, next) {
  res.noCache();
  next();
});

var middlewarePassport = rootRequire('/server/app/middlewares/middleware-passport.js');
router.use(middlewarePassport({preload: true}));

router.get('/internalplans', auth.isAuthenticated(), controller.showInternalplans);
router.post('/subscriptions', auth.isAuthenticated(), controller.createSubscriptions);
router.post('/gifts', auth.isAuthenticated(), controller.createGift);
router.get('/coupons', auth.isAuthenticated(), controller.validateCoupons);
router.get('/couponscampaigns', auth.isAuthenticated(), controller.getCouponCampains);
router.put('/subscriptions/:subscriptionUuid/cancel', auth.isAuthenticated(), controller.cancelSubscriptions);

module.exports = router;
