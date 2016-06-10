'use strict';

// Production specific configuration
// =================================
module.exports = {
  // Server IP
  ip: process.env.IP,

  // Server port
  port: process.env.PORT || 8080,

  backEnd: {
    publicProtocol: 'https',
    publicAuthority: 'afr-back-end-staging.herokuapp.com'
  },

  player: {
    foo: 'bar'
  },

  frontEnd: {
    protocol: 'https',
    authority: 'afrostream-staging.herokuapp.com'
  },

  sendGrid: {
    api_key: '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'
  },

  sequelize: {
    uri: process.env.DATABASE_URL,
    options: {
      logging: false,
      storage: 'afrostream.postgres',
      define: {
        timestamps: false
      },
      dialect: 'postgres',
      dialectOptions: {
        ssl: true
      }
    },
    hooks: {
      mqModelBlacklist: ['Logs', 'AccessToken', 'RefreshToken', 'UsersVideos'],
      mqFields: ['_id', 'title']
    }
  },

  client: {
    jobs: {
      api: 'https://afrostream-jobs-staging.herokuapp.com/api',
      basicAuth: {
        user: 'afrostream',
        password: 'r4nd0mT0k3n',
        header: 'Authorization: Basic YWZyb3N0cmVhbTpyNG5kMG1UMGszbg=='
      }
    }
  },

  cdnselector: {
    enabled: true,
    timeout: 250, // ms
    endpoint: 'http://stats.adm.afrostream.net:8080',
    defaultAuthority: 'hw.cdn.afrostream.net',
    defaultScheme: 'https'
  },

  catchup: {
    bet: {
      catchupProviderId: 1,
      defaultCategoryId: 8,
      defaultExpiration: 1209600,
      defaultLicensorId: 25 // BET Viacom
    }
  },

  billings: {
    url: 'https://afrostream-billings-staging.herokuapp.com',
    apiUser: 'admin',
    apiPass: 'billingsapirocks'
  },

  pf: {
    timeout: 500,
    url: 'http://p-afsmsch-001.afrostream.tv:4000'
  },

  mq: {
    endPoint: 'amqp://yvkmghav:Uu-J25iHVqXV7C0_60e1V2JSgb0sEQ-3@chicken.rmq.cloudamqp.com/yvkmghav',
    exchangeName: 'afrostream-backend'
  },

  logs: {
    basicAuth: {user: 'afrostream', password: 'r4nd0mT0k3n'}
  },

  bouygues: {
    clientID: '00140041210',
    clientSecret: '9T?8V97Z7'
  },

  orange: {
    clientID: 'SVOAFRA19A33F788FCE4',
    clientSecret: 'MIIDKTCCApKgAwIBAgIGAR9x+wRQMA0GCSqGSIb3DQEBBQUAMGAxFzAVBgNVBAoTDkZyYW5jZSBUZWxlY29tMRMwEQYDVQQDEwpUZXN0U2l0ZUlEMTAwLgYJKoZIhvcNAQkBFiFnYWVsLmdvdXJtZWxlbkBvcmFuZ2UtZnRncm91cC5jb20wHhcNMDcxMDA0MTQ0NzUzWhcNMTcxMDAxMTQ0NzUzWjBgMRcwFQYDVQQKEw5GcmFuY2UgVGVsZWNvbTETMBEGA1UEAxMKVGVzdFNpdGVJRDEwMC4GCSqGSIb3DQEJARYhZ2FlbC5nb3VybWVsZW5Ab3JhbmdlLWZ0Z3JvdXAuY29tMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDUcgjaY7tqLy+dNQJMUVChHrMjzOpWEi370gOXB2Cy/xiPpSGhfDLbs9sKSn9Cpw93mublOhvwQlEWS2SwYpSfqpARiqOyFAoeclyoxCz8JTsjbZD/NsqW4gCwJfcY3t7buEaO8rwTj2DDuIadbFMZOLr7KmMezHqwd6CNiXXCeQIDAQABo4HtMIHqMBYGCWCGSAGG+EIBDQQJFgdbR0ddIENBMB0GA1UdDgQWBBT9bZlATmC57VbMjxrl2hfbna82UDCBjwYDVR0jBIGHMIGEgBT9bZlATmC57VbMjxrl2hfbna82UKFkpGIwYDEXMBUGA1UEChMORnJhbmNlIFRlbGVjb20xEzARBgNVBAMTClRlc3RTaXRlSUQxMDAuBgkqhkiG9w0BCQEWIWdhZWwuZ291cm1lbGVuQG9yYW5nZS1mdGdyb3VwLmNvbYIGAR9x+wRQMBIGA1UdEwEB/wQIMAYBAf8CAQAwCwYDVR0PBAQDAgEGMA0GCSqGSIb3DQEBBQUAA4GBAAEKb9PQR9IdSM8XRR9jaZF/FWjY7WDX17TUaehHl8JcfuNAwmoBDCiUmcc2rutw/bRKUSxGvx4UUSYzVBIONjUzJU8LHVIDotzJxOnIXG7ZQz8ymv9b9Ywhr7NGRQ8MYy6BIztlniPOr/P7VE0C0azHe+er5slu+FYtJ0qyumT3'
  },

  dumpPostData: true
};
