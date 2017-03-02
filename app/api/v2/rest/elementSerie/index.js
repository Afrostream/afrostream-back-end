'use strict';

const express = require('express');
const auth = rootRequire('app/api/v1/auth/auth.service');
const { index, show, create, update, destroy } = rootRequire('app/api/shared/rest/generic.controller');
const { middlewareNoCache, middlewareCache } = rootRequire('app/api/v1/rest/utils');
const router = express.Router();

const controller = require('./elementSerie.controller');

const ElementSerie = rootRequire('sqldb').ElementSerie;

router.use(auth.middleware.restrictRoutesToAuthentified());

router.get('/', middlewareNoCache, auth.hasRole('admin'), controller.index);
router.get('/:id', middlewareCache, controller.show);
router.post('/', middlewareNoCache, auth.hasRole('admin'), create({model: ElementSerie}));
router.put('/:id', middlewareNoCache, auth.hasRole('admin'), update({model: ElementSerie}));
router.patch('/:id', middlewareNoCache, auth.hasRole('admin'), update({model: ElementSerie}));
router.delete('/:id', middlewareNoCache, auth.hasRole('admin'), destroy({model: ElementSerie}));

module.exports = router;
