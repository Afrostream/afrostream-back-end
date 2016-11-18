'use strict';

var ans = require('afrostream-node-statsd');

ans.init({
  module: 'afrostream-back-end'
});

module.exports = ans;
