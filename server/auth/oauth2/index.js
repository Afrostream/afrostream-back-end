'use strict';

/**
 * @api {post} /auth/oauth2/token Oauth2 token
 * @apiName PostAuthOauth2Token
 * @apiGroup Auth
 *
 * @apiDescription this route allows you to get an access_token
 *
 * @apiParam (postData) {String} grant_type password|bouygues|refresh_token
 * @apiParam (postData) {String} client_id api client id
 * @apiParam (postData) {String} client_secret api client secret
 * @apiParam (postData) {String} username (grant_type=password) user email
 * @apiParam (postData) {String} password (grant_type=password) user password
 * @apiParam (postData) {String} id (grant_type=bouygues) bouygues customer id
 * @apiParam (postData) {String} refresh_token (grant_type=refresh_token) refresh token
 * @apiParamExample {String} grant_type: "password"
 *   {
 *     "grant_type": "password",
 *     "client_id": "apiKey",
 *     "client_secret": "apiSecret",
 *     "username": "foo@bar.com",
 *     "password": "123456"
 *   }
 * @apiParamExample {String} grant_type: "bouygues"
 *   {
 *     "grant_type": "bouygues",
 *     "client_id": "apiKey",
 *     "client_secret": "apiSecret",
 *     "id": "123456"
 *   }
 * @apiParamExample {String} grant_type: "refresh_token"
 *   {
 *     "grant_type": "refresh_token",
 *     "client_id": "apiKey",
 *     "client_secret": "apiSecret",
 *     "refresh_token": "42424242424242"
 *   }
 * @apiExample
 *   premier example
 * @apiSuccess (200) {String} access_token hexa string 32 char
 * @apiSuccess (200) {Number} expires_in seconds
 * @apiSuccessExample {json} Success-Response:
 *   HTTP/1.1 200 OK
 *   {
 *     "access_token": "9d005b334087f302986312ec572e39e46e63830b",
 *     "expires_in": "1800"
 *   }
 * @apiError (500) {String} error message
 * @apiError (403) {String} error message
 * @apiErrorExample {json} Error-Response grant_type password
 *   HTTP/1.1 403 Forbidden
 *   {
 *     "error": "invalid_grant",
 *     "error_description": "unknown user"
 *   }
 * @apiErrorExample {json} Error-Response grant_type password
 *   HTTP/1.1 403 Forbidden
 *   {
 *     "error": "invalid_grant",
 *     "error_description": "wrong password"
 *   }
 * @apiErrorExample {json} Error-Response grant_type bouygues
 *   HTTP/1.1 403 Forbidden
 *   {
 *     "error": "invalid_grant",
 *     "error_description": "unknown bouyguesId"
 *   }
 */

var express = require('express');
var oauth2 = require('./oauth2');
var router = express.Router();

var local = require('../local/local.controller.js');

// cross domain access to our api, staging only for tests
if (process.env.NODE_ENV === 'staging') {
  router.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
    next();
  });

  router.use(function (req, res, next) {
    if (req.method === 'OPTIONS') {
      res.send();
    } else {
      next();
    }
  });
}

router.post('/token', oauth2.token);
router.post('/autorization', oauth2.authorization);
router.post('/decision', oauth2.decision);

module.exports = router;
