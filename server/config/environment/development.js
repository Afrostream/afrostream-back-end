'use strict';

// Development specific configuration
// ==================================
module.exports = {
  // MongoDB connection options
  mongo: {
    uri: 'mongodb://localhost/afrostreamadmin-dev'
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
      basicAuth: {user: 'dev', password: 'dev', header: 'Authorization: Basic ZGV2OmRldg=='}
    }
  },

  dumpPostData: true,

  cdnselector: {
    enabled: false,
    timeout: 600, // ms
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
    url: 'http://billings.afrostream.dev',
    apiUser: 'admin',
    apiPass: 'billingsapirocks',
    promoLastSubscriptionMinDays: 30 * 6 // days, ~= 6 months
  },

  logs: {
    basicAuth: {user: 'dev', password: 'dev'}
  },

  mq: {
    endPoint: 'amqp://localhost',
    exchangeName: 'afrostream-backend',
    autoReconnect: false,
    displayErrors: false
  },

  // if you want to seed:
  // use: export SEED_DB=true before launching node/grunt
  seedDB: (process.env.SEED_DB === 'true')
};
