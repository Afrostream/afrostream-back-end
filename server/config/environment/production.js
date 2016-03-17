'use strict';

// Production specific configuration
// =================================
module.exports = {
  // Server IP
  ip: process.env.OPENSHIFT_NODEJS_IP ||
  process.env.IP ||
  undefined,

  // Server port
  port: process.env.OPENSHIFT_NODEJS_PORT ||
  process.env.PORT ||
  8080,

  // MongoDB connection options
  mongo: {
    uri: process.env.MONGOLAB_URI ||
    process.env.MONGOHQ_URL ||
    process.env.OPENSHIFT_MONGODB_DB_URL +
    process.env.OPENSHIFT_APP_NAME ||
    'mongodb://localhost/afrostreamadmin'
  },

  player: {
    foo: 'bar'
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
      mqModelBlacklist: [ 'Logs', 'AccessToken', 'RefreshToken' ],
      mqFields: [ '_id', 'title' ]
    }
  },

  client: {
    jobs: {
      api: 'https://afrostream-jobs.herokuapp.com/api',
      basicAuth: {user: 'afrostream', password: 'r4nd0mT0k3n', header: 'Authorization: Basic YWZyb3N0cmVhbTpyNG5kMG1UMGszbg=='}
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

  mq: {
    endPoint: 'amqp://bjkjcuac:AZXv0QBokSQpjM545tlFXTMER2QN9F9K@chicken.rmq.cloudamqp.com/bjkjcuac',
    exchangeName: 'afrostream-backend'
  },

  logs: {
    basicAuth: {user: 'afrostream', password: 'r4nd0mT0k3n'}
  },

  dumpPostData: true
};
