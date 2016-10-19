'use strict';

// Test specific configuration
// ===========================
module.exports = {
  player: {
    foo: 'bar'
  },

  frontEnd: {
    protocol: 'http',
    authority: 'localhost:3000'
  },

  sequelize: {
    uri: 'postgres://postgres:root@localhost:5432/afrostream',
    options: {
      logging: console.log,
      storage: 'dev.postgres',
      define: {
        timestamps: false
      }
    },
    hooks: {
      mqModelBlacklist: [ 'Logs', 'AccessToken', 'RefreshToken', 'UsersVideos' ],
      mqFields: [ '_id', 'title' ]
    }
  },

  sendGrid: {
    api_key: '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',
    doNotSend: true
  },


  client: {
    jobs: {
      api: 'http://localhost:12000/api',
      basicAuth: {user: 'test', password: 'test', header: 'Authorization: Basic dGVzdDp0ZXN0'}
    }
  },

  bouygues: {
    clientID: '00140041210',
    clientSecret: '9T?8V97Z7'
  },

  orange: {
    clientID: 'SVOAFRA19A33F788FCE4',
    clientSecret: 'MIIDKTCCApKgAwIBAgIGAR9x+wRQMA0GCSqGSIb3DQEBBQUAMGAxFzAVBgNVBAoTDkZyYW5jZSBUZWxlY29tMRMwEQYDVQQDEwpUZXN0U2l0ZUlEMTAwLgYJKoZIhvcNAQkBFiFnYWVsLmdvdXJtZWxlbkBvcmFuZ2UtZnRncm91cC5jb20wHhcNMDcxMDA0MTQ0NzUzWhcNMTcxMDAxMTQ0NzUzWjBgMRcwFQYDVQQKEw5GcmFuY2UgVGVsZWNvbTETMBEGA1UEAxMKVGVzdFNpdGVJRDEwMC4GCSqGSIb3DQEJARYhZ2FlbC5nb3VybWVsZW5Ab3JhbmdlLWZ0Z3JvdXAuY29tMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDUcgjaY7tqLy+dNQJMUVChHrMjzOpWEi370gOXB2Cy/xiPpSGhfDLbs9sKSn9Cpw93mublOhvwQlEWS2SwYpSfqpARiqOyFAoeclyoxCz8JTsjbZD/NsqW4gCwJfcY3t7buEaO8rwTj2DDuIadbFMZOLr7KmMezHqwd6CNiXXCeQIDAQABo4HtMIHqMBYGCWCGSAGG+EIBDQQJFgdbR0ddIENBMB0GA1UdDgQWBBT9bZlATmC57VbMjxrl2hfbna82UDCBjwYDVR0jBIGHMIGEgBT9bZlATmC57VbMjxrl2hfbna82UKFkpGIwYDEXMBUGA1UEChMORnJhbmNlIFRlbGVjb20xEzARBgNVBAMTClRlc3RTaXRlSUQxMDAuBgkqhkiG9w0BCQEWIWdhZWwuZ291cm1lbGVuQG9yYW5nZS1mdGdyb3VwLmNvbYIGAR9x+wRQMBIGA1UdEwEB/wQIMAYBAf8CAQAwCwYDVR0PBAQDAgEGMA0GCSqGSIb3DQEBBQUAA4GBAAEKb9PQR9IdSM8XRR9jaZF/FWjY7WDX17TUaehHl8JcfuNAwmoBDCiUmcc2rutw/bRKUSxGvx4UUSYzVBIONjUzJU8LHVIDotzJxOnIXG7ZQz8ymv9b9Ywhr7NGRQ8MYy6BIztlniPOr/P7VE0C0azHe+er5slu+FYtJ0qyumT3'
  },

  netsize: {
    callbackBaseUrl: 'https://afrostream.dev',
    uri: 'http://qa.pay.netsize.com/API/1.2/',
    key: '368b8163dca54e64a17ec098d63d2464',
    serviceId: 1,
    productType: 121,
    "initialize-authentication-success-code-list": [ "120" ]
  },

  cdnselector: {
    enabled: true,
    timeout: 250, // ms
    endpoint: 'http://localhost:42424',
    defaultAuthority: 'hw.cdn.afrostream.net',
    defaultScheme: 'https'
  },

  catchup: {
    bet: {
      catchupProviderId: 1,
      defaultCategoryId: 3000000,
      defaultExpiration: 1209600,
      defaultLicensorId: null
    }
  },

  billings: {
    mocked: true,
    url: 'http://billings.afrostream.dev',
    apiUser: 'admin',
    apiPass: 'billingsapirocks'
  },

  pf: {
    timeout: 500,
    url: 'http://p-afsmsch-001.afrostream.dev'
  },

  mq: {
    endPoint: 'amqp://localhost',
    exchangeName: 'afrostream-backend',
    autoReconnect: false,
    displayErrors: false
  },

  logs: {
    basicAuth: {user: 'test', password: 'test'}
  },

  env: 'test',

  cookies: {
    secret: '2342REJIEJIZJO29J9JGZF',
    test: {
      name: 'test',
      domain: '.afrostream.dev'
    },
    netsize: {
      name: 'netsize',
      domain: '.afrostream.dev'
    }
  }
};
