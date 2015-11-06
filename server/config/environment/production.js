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

  sendGrid: {
    api_user: 'azure_3e7c4f32e08f4c0ba3c3ec8eb6c2fe58@azure.com',
    api_key: 'Afr@stream77'
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

  dumpPostData: true
};
