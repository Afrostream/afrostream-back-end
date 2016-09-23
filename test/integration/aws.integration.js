'use strict';

var assert = require('better-assert');

var bootstrap = require('../bootstrap.js');

var fs = require('fs');

var aws = rootRequire('/aws');

describe('Send to bucket', function() {
  var kitten;

  // load kitten file
  before(function () {
    kitten = fs.readFileSync(__dirname + '/../data/kitten.jpg');
  });

  it('should load in aws without errors', function(done) {
    var bucket = aws.getBucket('afrostream-img');
    aws.putBufferIntoBucket(bucket, kitten, 'image/jpeg', 'test/{env}/{date}/{rand}-kitten.jpg')
      .then(function (data) {
        assert(data.req.url.match(/kitten\.jpg/));
        done();
      })
  });
});