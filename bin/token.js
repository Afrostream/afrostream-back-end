#!/usr/bin/env node

var request = require('request');
var program = require('commander');

program
  .version('0.0.1')
  .option('-c, --client [clientName]', 'client name: front, tapptic, bouygues-miami, orange-newbox ; default=front')
  .option('-e, --env [env]', 'env: localhost, cdnOrangeStaging, staging, prod, prodBouyguesMiami, prodOrange, prodLegacyApi; default=staging')
  .option('-u, --username [username]', 'username, default=tech@afrostream.tv')
  .option('-p, --password [password]', 'password')
  .option('-r, --request [request]', 'path to request')
  .parse(process.argv);

var username = program.username || 'tech@afrostream.tv';
var password = program.password || 'afrostream77';

if (!password) {
  console.error('missing password');
  program.help();
}

var clientsConf = {
  tapptic: { id: "1abf31b2-8269-442f-9fd2-f3a63bda64b4", secret: "ba287044-65cf-4c30-a6f7-51aed34d4791" },
  front: { id: "8c261045-89a3-44bb-af38-65a847269605", secret: "3dc3cae6-9c79-487a-9e0f-712be857dcee" },
  "bouygues-miami": { id: "cbd89e11-c8a2-45ab-93be-deaade1bd17f", secret: "6bb9d594-9b4c-489b-ab04-d76dda10c76a" },
  "orange-newbox": { id: "66355a25-99bb-422a-a01f-5ce5b37c9f77", secret: "66e732ac-2d8f-4c3e-bd8b-cfde890bcde6" }
};

var client = program.client || "front";

if (typeof clientsConf[client] === 'undefined') {
  console.error('unknown client, should be in ' + Object.keys(clientsConf).join(', '));
  program.help();
}

console.log('using client ' + client);

var env = program.env || "staging";

var envsConf = {
  localhost: { baseUrl: "http://localhost:9000" },
  cdnOrangeStaging: {
    baseUrl : "https://legacy-api-orange-staging.afrostream.tv",
    host: "legacy-api-orange-staging.afrostream.tv"
  },
  staging: { baseUrl : "https://afr-back-end-staging.herokuapp.com" },
  prod: { baseUrl : "https://afrostream-backend.herokuapp.com" },
  prodLegacyApi: {
    baseUrl: "https://legacy-api.afrostream.tv"
  , host: "legacy-api.afrostream.tv"
  },
  prodOrange: {
    baseUrl: "https://legacy-api-orange.afrostream.tv"
  , host: "legacy-api-orange.afrostream.tv"
},
prodBouyguesMiami: {
  baseUrl: "https://legacy-api-bouygues.afrostream.tv",
  host: "legacy-api-bouygues.afrostream.tv"
}
};

if (typeof envsConf[env] === 'undefined') {
  console.error('unknown client, should be in ' + Object.keys(envsConf).join(', '));
  program.help();
}

// https://afr-back-end-staging.herokuapp.com/auth/oauth2/toke

console.log('using env ' + env);

var options = {
  uri: envsConf[env].baseUrl + "/api/auth/oauth2/token",
  method: 'POST',
  json: true,
  body: {
    grant_type: "password",
    username: username,
    password: password,
    client_id: clientsConf[client].id,
    client_secret: clientsConf[client].secret
  }
};

if (envsConf[env].host) {
  options.headers = (options.headers || {});
  options.headers.Host = envsConf[env].host;
}

console.log('[REQUEST]: ' + JSON.stringify(options));

request(options, function (error, response, body) {
  if (error) {
    console.error(error, response, body);
    process.exit(1);
  }
  console.log(body);
  if (program.request) {
    var options = {
      uri: envsConf[env].baseUrl + program.request,
      method: 'GET',
      headers: {
        Authorization: 'Bearer '+body.access_token
      },
      json: true
    };

    if (envsConf[env].host) {
      options.headers = (options.headers || {});
      options.headers.Host = envsConf[env].host;
    }

    console.log('[REQUEST]: ' + JSON.stringify(options));

    request(options, function (error, response, body) {
      if (error) {
        console.error(error, response, body);
        process.exit(1);
      }
      console.log("===================RESPONSE====================");
      console.log(response.headers);
      console.log("===================BODY====================");
      console.log(require('util').inspect(body, { depth: 10 }));
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});
