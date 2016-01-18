'use strict';

var path = require('path');
var _ = require('lodash');

// All configurations will extend these options
// ============================================
var all = {
  env: process.env.NODE_ENV,

  // Root path of server
  root: path.normalize(__dirname + '/../..'),

  // Server port
  port: process.env.PORT || 9000,

  // Server IP
  ip: process.env.IP || '0.0.0.0',

  // --------------------------------
  // /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\
  //   NEVER CHANGE THIS VALUE
  // /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\
  seedDB: false,
  // --------------------------------

  // Secret for session, you will want to change this and make it an environment variable
  secrets: {
    session: 'afrostream-admin-secret',
    expire: parseInt(process.env.USER_TOKEN_EXPIRE, 10) || 1800,
    videoExpire: process.env.VIDEO_TOKEN_EXPIRE || 300 // FIXME: int or string ...
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
    key: process.env.AWS_ACCESS_KEY_ID || 'AKIAIJ7BEEEIYX3CZDOQ',
    secret: process.env.AWS_SECRET_ACCESS_KEY || '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',
    s3Bucket: process.env.S3_BUCKET_NAME || 'afrostream-img',
    region: 'eu-west-1'
  },

  imgix: {
    domain: process.env.IMGIX_DOMAIN || 'https://afrostream.imgix.net'  // GRRRRR... should NOT contain "https://"
  },

  // FIXME: config env vars DIGIBOS => MAM
  mam: {
    domain: process.env.DIGIBOS_DOMAIN || process.env.MAM_DOMAIN || 'http://mam.afrostream.tv:3000/api/contents',// FIXME: should be a dev video platform environment
    proxy: process.env.DIGIBOS_PROXY || process.env.MAM_PROXY || 'http://origin.afrostream.tv',
    useToken: process.env.DIGIBOS_TOKEN || process.env.MAM_TOKEN || true
  },

  facebook: {
    clientID: process.env.FACEBOOK_ID || '828887693868980',
    clientSecret: process.env.FACEBOOK_SECRET || '25130290468ec21fbefd1604218cc57c',
    callbackURL: (process.env.FACEBOOK_CALLBACK_DOMAIN || 'http://localhost:3000') + '/auth/facebook/callback',
    failureURL: (process.env.FACEBOOK_CALLBACK_DOMAIN || 'http://localhost:3000') + '/auth/facebook/failure',
    successURL: (process.env.FACEBOOK_CALLBACK_DOMAIN || 'http://localhost:3000') + '/auth/facebook/success'
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
  // access:   https://app.recurly.com/login
  // login:    johnarch.ma@gmail.com
  // password: Afrostream77
  recurly: {
    subdomain: process.env.RECURLY_SUB_DOMAIN || 'johnarch',
    apiKey: process.env.RECURLY_API_KEY || '67dbb29f0dbe4e219bc247a3b5387652'
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
  require('./environment/' + process.env.NODE_ENV + '.js') || {}
);
