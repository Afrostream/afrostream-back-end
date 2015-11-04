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

  client: {
    jobs: {
      api: 'http://localhost:12000/api',
      basicAuth: {user: 'dev', password: 'dev'}
    }
  },

  dumpPostData: true,

  // if you want to seed:
  // use: export SEED_DB=true before launching node/grunt
  seedDB: (process.env.SEED_DB === 'true')
};
