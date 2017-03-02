'use strict';

const express = require('express');
const middlewareAdminOnly = rootRequire('app/api/v2/auth/auth.service').middlewares.adminOnly;
const { create, update, destroy } = rootRequire('app/api/shared/rest/generic.controller');
const { middlewareNoCache, middlewareCache } = rootRequire('app/api/v1/rest/utils');
const router = express.Router();

const controller = require('./item.controller');

const Item = rootRequire('sqldb').Item;

router.get('/', middlewareNoCache, middlewareAdminOnly, controller.index);
router.get('/:id', middlewareCache, controller.show);
router.post('/', middlewareNoCache, middlewareAdminOnly, create({model: Item}));
router.put('/:id', middlewareNoCache, middlewareAdminOnly, update({model: Item}));
router.patch('/:id', middlewareNoCache, middlewareAdminOnly, update({model: Item}));
router.delete('/:id', middlewareNoCache, middlewareAdminOnly, destroy({model: Item}));

module.exports = router;
