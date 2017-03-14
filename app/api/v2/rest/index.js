const express = require('express');
const router = express.Router();
const sqldb = rootRequire('sqldb');
const utils = rootRequire('/app/api/v2/rest/utils');

// kiss:
// l'api-v2 n'est accessible qu'aux users authentifés (inscrits ou abonnés).
// on devra probablement ouvrir l'api aux "clients" authentifiés.
const auth = rootRequire('app/api/v1/auth/auth.service');
const middlewarePassport = rootRequire('app/middlewares/middleware-passport.js');
const middlewareBroadcaster = rootRequire('app/middlewares/middleware-broadcaster.js');
const middlewareCountry = rootRequire('app/middlewares/middleware-country.js');
const middlewareMetricsHitsByCountry = rootRequire('app/middlewares/middleware-metricshitsbycountry.js');

router.use(middlewarePassport({ preload: true }));
router.use(auth.middleware.restrictToAuthentifiedUsers());
router.use(middlewareBroadcaster());
router.use(middlewareCountry());
router.use(middlewareMetricsHitsByCountry());

// CRUD
router.use('/films', utils.routerCRUD({Model: sqldb.Film}));
router.use('/lives', utils.routerCRUD({Model: sqldb.Live}));
router.use('/series', utils.routerCRUD({Model: sqldb.Serie}));
router.use('/seasons', utils.routerCRUD({Model: sqldb.Season}));
router.use('/episodes', utils.routerCRUD({Model: sqldb.Episode}));
router.use('/categorys', utils.routerCRUD({Model: sqldb.Category}));

module.exports = router;
