'use strict';

var heapdump = require('heapdump');

var heapdumps = [];

module.exports.create = function (req, res) {
  var name = Date.now() + '.heapdump';
  heapdump.writeSnapshot(__dirname + '/data/' + name);
  heapdumps.push(name);
  res.send(name+' created');
};

module.exports.index = function (req, res) {
  res.json(heapdumps);
};

module.exports.show = function (req, res) {
  res.sendFile(__dirname + '/data/' + req.params.name);
};
