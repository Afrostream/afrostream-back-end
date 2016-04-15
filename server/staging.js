'use strict';

// RUN the dev code with NODE_ENV=staging.
process.env.CLOUDAMQP_URL = 'amqp://yvkmghav:Uu-J25iHVqXV7C0_60e1V2JSgb0sEQ-3@chicken.rmq.cloudamqp.com/yvkmghav';
process.env.DATABASE_URL = 'postgres://u4fp4ad34q8qvi:pt7eht3e9v3lnehhh27m7sfeol@ec2-54-228-194-210.eu-west-1.compute.amazonaws.com:5522/d71on7act83b7i';
process.env.FACEBOOK_CALLBACK_DOMAIN = 'https://staging.afrostream.tv';
process.env.FACEBOOK_ID = '828887693868980';
process.env.FACEBOOK_SECRET = '25130290468ec21fbefd1604218cc57c';
process.env.HEROKU_APP_ID = '9d819067-e998-4fb8-a7d2-d242efdc311f';
process.env.HEROKU_APP_NAME = 'afr-back-end-staging';
/*
process.env.HEROKU_RELEASE_VERSION = 'v21';
process.env.HEROKU_SLUG_COMMIT = 'b99d452a561fd4d6d8bf1562f2e29d1601eb7519';
process.env.HEROKU_SLUG_DESCRIPTION = 'Deploy c2ebd25';
*/
process.env.NODE_ENV = 'staging';
process.env.PORT = '9000';

var cluster = require('express-cluster');

var clusterConf = { count: 1, verbose: true};

cluster(function (worker) {
  console.log('worker '+worker.id+' is up');
  return require('./app');
}, clusterConf);
