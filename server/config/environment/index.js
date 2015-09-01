'use strict';

var path = require('path');
var _ = require('lodash');

function requiredProcessEnv(name) {
  if (!process.env[name]) {
    throw new Error('You must set the ' + name + ' environment variable');
  }
  return process.env[name];
}

// All configurations will extend these options
// ============================================
var all = {
  env: process.env.NODE_ENV,

  // Root path of server
  root: path.normalize(__dirname + '/../../..'),

  // Server port
  port: process.env.PORT || 9000,

  // Server IP
  ip: process.env.IP || '0.0.0.0',

  // Should we populate the DB with sample data?
  seedDB: false,

  // Secret for session, you will want to change this and make it an environment variable
  secrets: {
    session: 'afrostream-admin-secret',
    expire: process.env.USER_TOKEN_EXPIRE || 1800,
    videoExpire: process.env.VIDEO_TOKEN_EXPIRE || 300
  },
  oauth2: true,
  // List of user roles
  userRoles: ['guest', 'user', 'client', 'admin'],

  // MongoDB connection options
  mongo: {
    options: {
      db: {
        safe: true
      }
    }
  },

  amazon: {
    key: process.env.AWS_ACCESS_KEY_ID,
    secret: process.env.AWS_SECRET_ACCESS_KEY,
    s3Bucket: process.env.S3_BUCKET_NAME,
    region: 'eu-west-1'
  },

  imgix: {
    domain: process.env.IMGIX_DOMAIN || 'afrostream.imgix.net'
  },

  digibos: {
    domain: process.env.DIGIBOS_DOMAIN || 'http://mam.integ.zantetsuken.org:3000/api/contents',
    proxy: process.env.DIGIBOS_PROXY || 'http://origin.afrostream.tv',
    useToken: process.env.DIGIBOS_TOKEN || true
  },

  google: {
    clientID: process.env.GOOGLE_ID || 'id',
    clientSecret: process.env.GOOGLE_SECRET || 'secret',
    callbackURL: (process.env.DOMAIN || '') + '/auth/google/callback'
  },
  pagination: {
    total: 10000,
    max: 10000
  },
  recurly: {
    subdomain: process.env.RECURLY_SUB_DOMAIN || 'afrostream',
    apiKey: process.env.RECURLY_API_KEY || '82e5ec329c384b4995b979cc63536796'
  },
  algolia: {
    appId: process.env.ALGOLIA_APP_ID || '3OKNPL7ZVA',
    apiKey: process.env.ALGOLIA_API_KEY || '47d48040a13e973aca2ea9f492eca17e'
  },
  sendGrid: {
    api_user: process.env.SEND_GRID_CLIENT_ID || 'azure_3e7c4f32e08f4c0ba3c3ec8eb6c2fe58@azure.com',
    api_key: process.env.SEND_GRID_API_KEY || 'Afr@stream77'
  }
};

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = _.merge(
  all,
  require('./' + process.env.NODE_ENV + '.js') || {});
