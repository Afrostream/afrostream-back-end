#!/usr/bin/env node

var request = require('request');

require('request-debug')(request);

request(
  {
    uri: 'http://legacy-api-orange-staging.afrostream.tv/auth/oauth2/token',
    //uri: 'http://afr-back-end-staging.herokuapp.com/auth/oauth2/token',
    method: 'POST',
    json: true,
    headers: {
      'User-Agent': 'curl/7.35.0',
      'Content-Type': 'application/json'
    },
    body:
     {
      grant_type: 'password',
       username: 'marc.dassonneville@gmail.com',
       password: 'xxxx',
       "client_id": '66355a25-99bb-422a-a01f-5ce5b37c9f77',
       "client_secret": '66e732ac-2d8f-4c3e-bd8b-cfde890bcde6'
     }
  }
, function (err, response, body) {
  console.log('ERROR = ', err);
  console.log('body = ', body);
});

/*
var fetch = require('node-fetch');
fetch('http://legacy-api-orange-staging.afrostream.tv/auth/oauth2/token', {
  method: 'POST',
  body: {
   grant_type: 'password',
    username: 'marc.dassonneville@gmail.com',
    password: 'xxxx',
    client_id: '66355a25-99bb-422a-a01f-5ce5b37c9f77',
    client_secret: '66e732ac-2d8f-4c3e-bd8b-cfde890bcde6'
  }
})
.then(function (res) {
  return res.text();
})
.then(function (json) {
  console.log(json);
}, function (err) {
  console.error('ERROR', err);
})

setTimeout(function () {
  console.log('aa')
}, 10000);
*/
