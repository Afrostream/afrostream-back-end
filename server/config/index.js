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

  //===FIXME merge orange/bouygues/facebook config
  facebook: {
    clientID: process.env.FACEBOOK_ID || '828887693868980',
    clientSecret: process.env.FACEBOOK_SECRET || '25130290468ec21fbefd1604218cc57c',
    callbackURL: (process.env.FACEBOOK_CALLBACK_DOMAIN || 'http://localhost:3000') + '/auth/facebook/callback',
    failureURL: (process.env.FACEBOOK_CALLBACK_DOMAIN || 'http://localhost:3000') + '/auth/facebook/failure'
  },

  bouygues: {
    clientID: process.env.BOUYGUES_ID || '00140041210',
    clientSecret: process.env.BOUYGUES_SECRET || '00140041210:9T?8V97Z7',
    callbackURL: (process.env.BOUYGUES_CALLBACK_DOMAIN || 'http://localhost:3000') + '/auth/bouygues/callback',
    failureURL: (process.env.BOUYGUES_CALLBACK_DOMAIN || 'http://localhost:3000') + '/auth/bouygues/failure'
  },

  orange: {
    clientID: process.env.ORANGE_ID || 'SVOAFRA19A33F788FCE4',
    clientSecret: process.env.ORANGE_SECRET || 'MIIDKTCCApKgAwIBAgIGAR9x+wRQMA0GCSqGSIb3DQEBBQUAMGAxFzAVBgNVBAoTDkZyYW5jZSBUZWxlY29tMRMwEQYDVQQDEwpUZXN0U2l0ZUlEMTAwLgYJKoZIhvcNAQkBFiFnYWVsLmdvdXJtZWxlbkBvcmFuZ2UtZnRncm91cC5jb20wHhcNMDcxMDA0MTQ0NzUzWhcNMTcxMDAxMTQ0NzUzWjBgMRcwFQYDVQQKEw5GcmFuY2UgVGVsZWNvbTETMBEGA1UEAxMKVGVzdFNpdGVJRDEwMC4GCSqGSIb3DQEJARYhZ2FlbC5nb3VybWVsZW5Ab3JhbmdlLWZ0Z3JvdXAuY29tMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDUcgjaY7tqLy+dNQJMUVChHrMjzOpWEi370gOXB2Cy/xiPpSGhfDLbs9sKSn9Cpw93mublOhvwQlEWS2SwYpSfqpARiqOyFAoeclyoxCz8JTsjbZD/NsqW4gCwJfcY3t7buEaO8rwTj2DDuIadbFMZOLr7KmMezHqwd6CNiXXCeQIDAQABo4HtMIHqMBYGCWCGSAGG+EIBDQQJFgdbR0ddIENBMB0GA1UdDgQWBBT9bZlATmC57VbMjxrl2hfbna82UDCBjwYDVR0jBIGHMIGEgBT9bZlATmC57VbMjxrl2hfbna82UKFkpGIwYDEXMBUGA1UEChMORnJhbmNlIFRlbGVjb20xEzARBgNVBAMTClRlc3RTaXRlSUQxMDAuBgkqhkiG9w0BCQEWIWdhZWwuZ291cm1lbGVuQG9yYW5nZS1mdGdyb3VwLmNvbYIGAR9x+wRQMBIGA1UdEwEB/wQIMAYBAf8CAQAwCwYDVR0PBAQDAgEGMA0GCSqGSIb3DQEBBQUAA4GBAAEKb9PQR9IdSM8XRR9jaZF/FWjY7WDX17TUaehHl8JcfuNAwmoBDCiUmcc2rutw/bRKUSxGvx4UUSYzVBIONjUzJU8LHVIDotzJxOnIXG7ZQz8ymv9b9Ywhr7NGRQ8MYy6BIztlniPOr/P7VE0C0azHe+er5slu+FYtJ0qyumT3',
    callbackURL: (process.env.ORANGE_CALLBACK_DOMAIN || 'http://localhost:3000') + '/auth/orange/callback',
    failureURL: (process.env.ORANGE_CALLBACK_DOMAIN || 'http://localhost:3000') + '/auth/orange/failure'
  },
  //===
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
  }
};

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = _.merge(
  all,
  require('./environment/' + process.env.NODE_ENV + '.js') || {}
);
