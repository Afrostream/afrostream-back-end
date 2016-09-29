'use strict';

// Production specific configuration
// =================================
module.exports = {
  backEnd: {
    publicProtocol: 'https',
    publicAuthority: 'afrostream-backend.herokuapp.com'
  },

  // MongoDB connection options
  mongo: {
    uri: process.env.MONGOLAB_URI ||
    process.env.MONGOHQ_URL ||
    process.env.OPENSHIFT_MONGODB_DB_URL +
    process.env.OPENSHIFT_APP_NAME ||
    'mongodb://localhost/afrostreamadmin'
  },

  frontEnd: {
    protocol: 'https',
    authority: 'afrostream.tv'
  },

  sendGrid: {
    api_key: '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'
  },

  sequelize: {
    uri: process.env.DATABASE_URL || 'postgres://postgres:root@localhost:5432/afrostream',
    options: {
      logging: false,
      storage: 'afrostream.postgres',
      define: {
        timestamps: false
      }
    },
    hooks: {
      mqModelBlacklist: ['Logs', 'AccessToken', 'RefreshToken', 'UsersVideos'],
      mqFields: ['_id', 'title']
    }
  },

  client: {
    jobs: {
      api: 'https://afrostream-jobs.herokuapp.com/api',
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
    endpoint: 'http://stats.adm.afrostream.net',
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
    url: 'https://billings.afrostream.tv',
    apiUser: 'admin',
    apiPass: 'billingsapirocks'
  },

  pf: {
    timeout: 1000,
    url: 'http://p-afsmsch-001.afrostream.tv:4000'
  },

  mq: {
    endPoint: 'amqp://bjkjcuac:AZXv0QBokSQpjM545tlFXTMER2QN9F9K@chicken.rmq.cloudamqp.com/bjkjcuac',
    exchangeName: 'afrostream-backend'
  },

  logs: {
    basicAuth: {user: 'afrostream', password: 'r4nd0mT0k3n'}
  },

  bouygues: {
    clientID: '00140041200',
    clientSecret: '1T%7VcR9s'
  },

  orange: {
    clientID: 'SVOAFRA19A33F788FCE4',
    clientSecret: 'MIIE4TCCA8mgAwIBAgIBAjANBgkqhkiG9w0BAQQFADCBqzELMAkGA1UEBhMCRlIxDDAKBgNVBAgTA04vQTEQMA4GA1UEBxMHTGFubmlvbjEXMBUGA1UEChMORnJhbmNlIFRlbGVjb20xFDASBgNVBAsTC09yYW5nZSBMYWJzMRswGQYDVQQDExJBdXRoZW50aWNhdGlvbiBBUEkxMDAuBgkqhkiG9w0BCQEWIWdhZWwuZ291cm1lbGVuQG9yYW5nZS1mdGdyb3VwLmNvbTAeFw0wODAyMjExMjA3MThaFw0xODAyMTgxMjA3MThaMIGrMQswCQYDVQQGEwJGUjEMMAoGA1UECBMDTi9BMRAwDgYDVQQHEwdMYW5uaW9uMRcwFQYDVQQKEw5GcmFuY2UgVGVsZWNvbTEUMBIGA1UECxMLT3JhbmdlIExhYnMxGzAZBgNVBAMTEkF1dGhlbnRpY2F0aW9uIEFQSTEwMC4GCSqGSIb3DQEJARYhZ2FlbC5nb3VybWVsZW5Ab3JhbmdlLWZ0Z3JvdXAuY29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4Qdfv/IlnrAfqr+41ya0WQWsDP6hFgfLNlfdFMQmqBtPrTcsJy2gK3D7nSqfQCOOTasjr5XKlL4lBDD/iMZcHt+7MnCpPUMQtIDtUPnstHg8ZGctI8Bzazw7bnwcf9/itA+eBkI3ujaeUHLn/q139oO9+zt3wTgUR0ONU6hCEzb8igUB2d/I6rjELU/s1NYIfFbvxHhzd8+qFjlS/0OjxHZXVrZfxKwfK8zLbfh73Mrl+PvHkXhwy6Tl9qbrJgQsTstRhCjSue8LncclRih7Y52AMepZKr1dkS2VT8sdk+BFwu8XOIbhEEsZs/uSwCm65g7vLjQqBREdj+goDlAEgQIDAQABo4IBDDCCAQgwHQYDVR0OBBYEFA8kJ6TLJ/UF+rJ1eWXh8zBuiFLwMIHYBgNVHSMEgdAwgc2AFA8kJ6TLJ/UF +rJ1eWXh8zBuiFLwoYGxpIGuMIGrMQswCQYDVQQGEwJGUjEMMAoGA1UECBMDTi9BMRAwDgYDVQQHEwdMYW5uaW9uMRcwFQYDVQQKEw5GcmFuY2UgVGVsZWNvbTEUMBIGA1UECxMLT3JhbmdlIExhYnMxGzAZBgNVBAMTEkF1dGhlbnRpY2F0aW9uIEFQSTEwMC4GCSqGSIb3DQEJARYhZ2FlbC5nb3VybWVsZW5Ab3JhbmdlLWZ0Z3JvdXAuY29tggECMAwGA1UdEwQFMAMBAf8wDQYJKoZIhvcNAQEEBQADggEBACGAgPnND6en/Ye850x6JSMu5d1Sd4EJFtWDoDdoiJGrJGbvrqM1beEFYdbZvafU+NtXf9mdy5dYwgsSJEY86jhAp63fqGaYXjMenAEsNXQVbhWFd3KEOCLA6mE1LuCbOMbSuwIePETLZjpZlPgiBoWu3FTbk0q5/1lqMRllDElfpckOK2n8MsH6j53Hndw7E+M5f0XFRx8edZZUq6qBOguDFWbfBCY3Eh/odaL0L/mGpVXVGGdgTaX23Jc4yJilYX36nwuaZgGZvyfBXjFq+ValmkO1qXLHFgk9MKG7RpB4tr5BmmkxXLgL3ucR4L1o5JpFssXxgY7ZGv04XENoj7o='
  },

  dumpPostData: true
};
