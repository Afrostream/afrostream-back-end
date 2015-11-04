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

  sequelize: {
    uri: process.env.DATABASE_URL || 'postgres://postgres:root@localhost:5432/afrostream',
    options: {
      logging: false,
      storage: 'afrostream.postgres',
      define: {
        timestamps: false
      }
    }
  },

  client: {
    jobs: {
      api: 'https://afrostream-jobs.herokuapp.com/api',
      basicAuth: {user: 'afrostream', password: 'r4nd0mT0k3n'}
    }
  },

  dumpPostData: true
};
