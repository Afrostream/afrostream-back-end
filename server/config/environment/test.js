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

  sequelize: {
    uri: 'postgres://postgres:root@localhost:5432/afrostream',
    options: {
      logging: false,
      storage: 'dev.postgres',
      define: {
        timestamps: false
      }
    }
  },

  client: {
    jobs: {
      api: 'http://localhost:12000/api',
      basicAuth: {user: 'test', password: 'test'}
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
      id: 3000000
    }
  },

  env: 'test'
};
