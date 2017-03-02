'use strict';

const express = require('express');
const auth = rootRequire('app/api/v1/auth/auth.service');
const { create, update, destroy } = rootRequire('app/api/shared/rest/generic.controller');
const { middlewareNoCache, middlewareCache } = rootRequire('app/api/v1/rest/utils');
const router = express.Router();

const controller = require('./item.controller');

const Item = rootRequire('sqldb').Item;

router.use(auth.middleware.restrictRoutesToAuthentified());

router.get('/', middlewareNoCache, auth.hasRole('admin'), controller.index);
router.get('/:id', middlewareCache, controller.show);
//router.get('/:element', middlewareNoCache, auth.hasRole('admin'), controller.index());
router.post('/', middlewareNoCache, auth.hasRole('admin'), create({model: Item}));
router.put('/:id', middlewareNoCache, auth.hasRole('admin'), update({model: Item}));
router.patch('/:id', middlewareNoCache, auth.hasRole('admin'), update({model: Item}));
router.delete('/:id', middlewareNoCache, auth.hasRole('admin'), destroy({model: Item}));

module.exports = router;
