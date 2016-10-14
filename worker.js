'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// tempfix: bouygues (faut les piquer)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// global
global.__basedir = __dirname;
global.rootRequire = function (name) { return require(global.__basedir + '/' + (name[0] === '/' ? name.substr(1) : name)); };

process.on('uncaughtException', function (err) {
  console.error('[ERROR]: uncaught error: ' + err.message  + ' stack = ', err.stack);
});

require('./app/index.js');
