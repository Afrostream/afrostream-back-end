'use strict';

/**
 * @api {get} /users/:id Request User information
 * @apiName GetUser
 * @apiGroup User
 *
 * @apiParam {Number} id User unique ID.
 *
 * @apiSuccess {String} name Name of the User.
 * @apiSuccess {String} email  Email of the User.
 * @apiSuccess {String} role  Role of the User.
 */

var express = require('express');
var controller = require('./user.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', auth.hasRole('admin'), controller.index);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);
router.get('/me', auth.isAuthenticated(), controller.me);
router.put('/verify', auth.isAuthenticated(), controller.verify);
router.put('/password', auth.isAuthenticated(), controller.auth0ChangePassword);
router.put('/:id/password', auth.isAuthenticated(), controller.changePassword);
router.put('/:id/role', auth.isAuthenticated(), controller.changeRole);
router.get('/:id', auth.isAuthenticated(), controller.show);
router.post('/', controller.create);

module.exports = router;
