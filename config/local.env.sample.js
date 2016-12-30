'use strict';

// Use local.env.js for environment variables that grunt will set when the server starts locally.
// Use for your api keys, secrets, etc. This file should not be tracked by git.
//
// You will need to set these on the server you deploy to.

module.exports = {
  DOMAIN: 'http://localhost:5602',
  SESSION_SECRET: 'afrostreamadmin-secret',

  FACEBOOK_ID: 'app-id',
  FACEBOOK_SECRET: 'secret',

  GOOGLE_ID: 'app-id',
  GOOGLE_SECRET: 'secret',

  // Control debug level for modules using visionmedia/debug
  DEBUG: '',

  AWS_ACCESS_KEY_ID: 'YOUR_AWS_ACCESS_KEY_ID',
  AWS_SECRET_ACCESS_KEY: 'YOUR_AWS_SECRET_ACCESS_KEY',
  S3_BUCKET_NAME: 'YOUR_S3_BUCKET_NAME',

  IMGIX_DOMAIN: 'YOUR IMGIX DOMAIN'
};
