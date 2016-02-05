'use strict';

var config = rootRequire('/server/config');

var billingApiApp = require('express')();
billingApiApp.get('/billings/api/subscriptions', function (req, res) {
  res.json({
    status: "done",
    statusMessage: "success",
    statusCode: 0,
    response: {
      subscriptions: [
        {
          subscriptionBillingUuid: "mock-billing-api",
          subscriptionProviderUuid: "mock-billing-api",
          isActive: "yes",
          user: {
            userBillingUuid: "mock-billing-api",
            userReferenceUuid: "123456",
            userProviderUuid: "mock-billing-api",
            provider: {
              providerName: "recurly"
            },
            userOpts: {
              email: "mock-billing-api",
              firstName: "mock-billing-api",
              lastName: "mock-billing-api"
            }
          },
          provider: {
            providerName: "recurly"
          },
          creationDate: "2016-02-03 10:02:50.750197+00",
          updatedDate: "2016-02-03 10:02:50.750197+00",
          subStatus: "active",
          subActivatedDate: "2015-08-31 23:00:00+00",
          subCanceledDate: null,
          subExpiresDate: null,
          subPeriodStartedDate: "2015-08-31 23:00:00+00",
          subPeriodEndsDate: "2016-08-31 23:00:00+00",
          internalPlan: {
            internalPlanUuid: "afrostreamambassadeurs2",
            name: "Ambassadeurs",
            description: "Ambassadeurs",
            amount_in_cents: "5999",
            currency: "EUR",
            cycle: "once",
            periodUnit: "year",
            periodLength: "1",
            internalPlanOpts: {
              internalMaxScreens: "2"
            }
          }
        }
      ]
    }
  });
});
billingApiApp.listen(config.billings.mockPort, function () {
  console.log('mock billing-api server listening on port ' + config.billings.mockPort);
});