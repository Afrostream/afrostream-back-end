'use strict';

const express = require('express');
const auth = rootRequire('app/api/v1/auth/auth.service');
const { index, show, create, update, destroy } = rootRequire('app/api/shared/rest/generic.controller');
const { middlewareNoCache, middlewareCache } = rootRequire('app/api/v1/rest/utils');
const router = express.Router();

const ElementCategory = rootRequire('sqldb').ElementCategory;

router.use(auth.middleware.restrictRoutesToAuthentified());

router.get('/', middlewareNoCache, auth.hasRole('admin'), index({model: ElementCategory}));
router.get('/:id', middlewareCache, show({model: ElementCategory}));
router.post('/', middlewareNoCache, auth.hasRole('admin'), create({model: ElementCategory}));
router.put('/:id', middlewareNoCache, auth.hasRole('admin'), update({model: ElementCategory}));
router.patch('/:id', middlewareNoCache, auth.hasRole('admin'), update({model: ElementCategory}));
router.delete('/:id', middlewareNoCache, auth.hasRole('admin'), destroy({model: ElementCategory}));

module.exports = router;
