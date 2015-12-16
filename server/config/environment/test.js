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

  // FIXME:
  amazon: {
    key: process.env.AWS_ACCESS_KEY_ID || 'AKIAIJ7BEEEIYX3CZDOQ',
    secret: process.env.AWS_SECRET_ACCESS_KEY || '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',
    s3Bucket: process.env.S3_BUCKET_NAME || 'afrostream-img',
    region: 'eu-west-1'
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
      catchupProviderId: 1,
      defaultCategoryId: 3000000,
      defaultExpiration: 1209600
    }
  },

  env: 'test'
};
