'use strict';

// security
if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging' || process.env.DATABASE_URL) {
  console.error('security: cannot mock on production / staging environment');
  console.error('exit 1');
  process.exit(1);
}

var config = rootRequire('/server/config');

var nock = require('nock');

console.log('mocking ' + config.billings.url);

nock(config.billings.url)
  .persist() // FIXME: we should call nock on demand
  .get('/billings/api/subscriptions/')
  .query(true)
  .reply(200, {
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

nock(config.billings.url)
  .persist() // FIXME: we should call nock on demand
  .get('/billings/api/internalplans/')
  .query({providerName: 'bachat',userReferenceUuid:/.*/})
  .reply(200, {
    status: "done",
    statusMessage: "success",
    statusCode: 0,
    response: {
      internalPlans: [
        {
          calledWithProviderNameBachat: true, // mock only
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
          calledWithProviderNameBachat: true, // mock only
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
    }
  });

nock(config.billings.url)
  .persist() // FIXME: we should call nock on demand
  .get('/billings/api/internalplans/')
  .query({providerName: /.+/,userReferenceUuid:/.*/})
  .reply(200, {
    status: "error",
    statusMessage: "unknown provider named : unknown",
    statusCode: 0,
    statusType: "internal",
    errors: [
      {
        error: {
          errorMessage: "unknown provider named :  unknown",
          errorType: "internal",
          errorCode: 0
        }
      }
    ]
  });

nock(config.billings.url)
  .persist() // FIXME: we should call nock on demand
  .get('/billings/api/internalplans/')
  .query({userReferenceUuid:/.*/})
  .reply(200, {
    status: "done",
    statusMessage: "success",
    statusCode: 0,
    response: {
      internalPlans: [
        {
          internalPlanUuid: "afrostreamgift",
          name: "Cadeau",
          description: "Cadeau",
          amountInCents: "5999",
          amountInCentsExclTax: "4799",
          vatRate: "20",
          currency: "EUR",
          cycle: "auto",
          periodUnit: "month",
          periodLength: "1",
          internalPlanOpts: [],
          providerPlans: {
            recurly: {
              providerPlanUuid: "afrostreamgift",
              name: "recurly_afrostreamgift_name",
              description: "recurly_afrostreamgift_description",
              provider: {
                providerName: "recurly"
              }
            }
          }
        },
        {
          internalPlanUuid: "afrostreampremium",
          name: "Do the right think",
          description: "Do the right think",
          amountInCents: "9999",
          amountInCentsExclTax: "7999",
          vatRate: "20",
          currency: "EUR",
          cycle: "auto",
          periodUnit: "year",
          periodLength: "1",
          internalPlanOpts: {
            internalMaxScreens: "2"
          },
          providerPlans: {
            recurly: {
              providerPlanUuid: "afrostreampremium",
              name: "recurly_afrostreampremium_name",
              description: "recurly_afrostreampremium_desc",
              provider: {
                providerName: "recurly"
              }
            }
          }
        },
        {
          internalPlanUuid: "afrostreamambassadeurs",
          name: "Ambassadeurs",
          description: "Ambassadeurs",
          amountInCents: "4999",
          amountInCentsExclTax: "3999",
          vatRate: "20",
          currency: "EUR",
          cycle: "auto",
          periodUnit: "year",
          periodLength: "1",
          internalPlanOpts: {
            internalMaxScreens: "2"
          },
          providerPlans: {
            recurly: {
              providerPlanUuid: "afrostreamambassadeurs",
              name: "afrostreamambassadeurs",
              description: "afrostreamambassadeurs",
              provider: {
                providerName: "recurly"
              }
            }
          }
        },
        {
          internalPlanUuid: "afrostreamambassadeurs2",
          name: "Ambassadeurs",
          description: "Ambassadeurs",
          amountInCents: "5999",
          amountInCentsExclTax: "4799",
          vatRate: "20",
          currency: "EUR",
          cycle: "once",
          periodUnit: "year",
          periodLength: "1",
          internalPlanOpts: [],
          providerPlans: {
            celery: {
              providerPlanUuid: "afrostreamambassadeurs",
              name: "afrostreamambassadeurs",
              description: "afrostreamambassadeurs",
              provider: {
                providerName: "celery"
              }
            }
          }
        },
        {
          internalPlanUuid: "afrostreammonthly",
          name: "Mensuel",
          description: "Mensuel",
          amountInCents: "699",
          amountInCentsExclTax: "559",
          vatRate: "20",
          currency: "EUR",
          cycle: "auto",
          periodUnit: "month",
          periodLength: "1",
          internalPlanOpts: {
            internalMaxScreens: "1"
          },
          providerPlans: {
            recurly: {
              providerPlanUuid: "afrostreammonthly",
              name: "recurly_afrostreammonthly_name",
              description: "recurly_afrostreammonthly_desc",
              provider: {
                providerName: "recurly"
              }
            }
          }
        },
        {
          internalPlanUuid: "afrostream_monthly",
          name: "Mensuel",
          description: "Mensuel",
          amountInCents: "699",
          amountInCentsExclTax: "559",
          vatRate: "20",
          currency: "EUR",
          cycle: "auto",
          periodUnit: "month",
          periodLength: "1",
          internalPlanOpts: {
            internalMaxScreens: "1"
          },
          providerPlans: {
            recurly: {
              providerPlanUuid: "afrostream_monthly",
              name: "recurly_afrostream_monthly_name",
              description: "recurly_afrostream_monthly_desc",
              provider: {
                providerName: "recurly"
              }
            }
          }
        },
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
    }
  });


nock(config.billings.url)
  .persist() // FIXME: we should call nock on demand
  .get('/billings/api/users/')
  .query({providerName:"celery", userReferenceUuid: /.*/})
  .reply(200, {
    status: "done",
    statusMessage: "success",
    statusCode: 0,
    response: {
      user: {
        userBillingUuid: "f6bd7d05-7a66-84c4-419f-b1b44ab1814a",
        userReferenceUuid: "1",
        userProviderUuid: "F_46B9F2D0-1612-179B-814D-8D9FF21954CF",
        provider: {
          providerName: "celery"
        },
        userOpts: {
          email: "tech@afrostream.tv",
          firstName: "firstNameValue",
          lastName: "lastNameValue"
        }
      }
    }
  });

nock(config.billings.url)
  .persist() // FIXME: we should call nock on demand
  .get('/billings/api/users/')
  .query({providerName:"recurly", userReferenceUuid: /.*/})
  .reply(200, {
    status: "done",
    statusMessage: "success",
    statusCode: 0,
    response: {
      user: {
        userBillingUuid: "f946e738-2c32-8144-d6bd-d7532256ae7b",
        userReferenceUuid: "1392",
        userProviderUuid: "oliviadigbiali@gmail.com",
        provider: {
          providerName: "recurly"
        },
        userOpts: {
          email: "oliviadigbiali@gmail.com",
          firstName: "firstNameValue",
          lastName: "lastNameValue"
        }
      }
    }
  });

nock(config.billings.url)
  .persist() // FIXME: we should call nock on demand
  .get('/billings/api/users/')
  .query({providerName:"gocardless", userReferenceUuid: /.*/})
  .reply(200, {
    status: "done",
    statusMessage: "success",
    statusCode: 0,
    response: {
      user: {
        userBillingUuid: "f946e738-2c32-8144-d6bd-d7532256ae7b",
        userReferenceUuid: "1392",
        userProviderUuid: "oliviadigbiali@gmail.com",
        provider: {
          providerName: "gocardless"
        },
        userOpts: {
          email: "oliviadigbiali@gmail.com",
          firstName: "firstNameValue",
          lastName: "lastNameValue"
        }
      }
    }
  });

nock(config.billings.url)
  .persist() // FIXME: we should call nock on demand
  .get('/billings/api/users/')
  .query({providerName:"bachat", userReferenceUuid: /.*/})
  .reply(200, {
    status: "done",
    statusMessage: "success",
    statusCode: 0,
    response: {
      user: {
        userBillingUuid: "f946e738-2c32-8144-d6bd-d7532256ae7b",
        userReferenceUuid: "1392",
        userProviderUuid: "oliviadigbiali@gmail.com",
        provider: {
          providerName: "bachat"
        },
        userOpts: {
          email: "oliviadigbiali@gmail.com",
          firstName: "firstNameValue",
          lastName: "lastNameValue"
        }
      }
    }
  });

nock(config.billings.url)
  .persist() // FIXME: we should call nock on demand
  .get('/billings/api/users/')
  .query()
  .reply(200, {
    status: "error",
    statusMessage: "NOT FOUND",
    statusCode: 0,
    statusType: "internal",
    errors: [
      {
        error: {
          errorMessage: "NOT FOUND",
          errorType: "internal",
          errorCode: 0
        }
      }
    ]
  });

nock(config.billings.url)
  .persist() // FIXME: we should call nock on demand
  .post('/billings/api/subscriptions/')
  .reply(200, {
      "status": "done",
      "statusMessage": "success",
      "statusCode": 0,
      "response": {
        "subscription": {
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
    }
  });
