'use strict';

// Test specific configuration
// ===========================
module.exports = {
  // MongoDB connection options
  mongo: {
    uri: 'mongodb://localhost/afrostreamadmin-test'
  },

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
      logging: false,
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

  mq: {
    endPoint: 'amqp://localhost',
    exchangeName: 'afrostream-backend',
    autoReconnect: false,
    displayErrors: false
  },

  logs: {
    basicAuth: {user: 'test', password: 'test'}
  },

  env: 'test'
};
