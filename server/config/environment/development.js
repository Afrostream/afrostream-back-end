'use strict';

// Development specific configuration
// ==================================
module.exports = {
  // MongoDB connection options
  mongo: {
    uri: 'mongodb://localhost/afrostreamadmin-dev'
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
  sendGrid: {
    api_user: 'azure_3e7c4f32e08f4c0ba3c3ec8eb6c2fe58@azure.com',
    api_key: 'Afr@stream77'
  },

  client: {
    jobs: {
      api: 'http://localhost:12000/api',
      basicAuth: {user: 'dev', password: 'dev'}
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

  // if you want to seed:
  // use: export SEED_DB=true before launching node/grunt
  seedDB: (process.env.SEED_DB === 'true')
};
