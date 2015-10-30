/**
 * Main application file
 */

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Setup server
var app =  require('express')();
require('./config/express')(app);
require('./routes')(app);

// Expose app
exports = module.exports = app;
