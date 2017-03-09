const express = require('express');
const router = express.Router();
const sqldb = rootRequire('sqldb');
const utils = rootRequire('/app/api/shared/rest/utils');

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
router.use('/items', require('./item'));
router.use('/elementCategories', utils.routerCRUD({Model: sqldb.ElementCategory}));
router.use('/elementEpisodes', utils.routerCRUD({Model: sqldb.ElementEpisode}));
router.use('/elementFilms', utils.routerCRUD({Model: sqldb.ElementFilm}));
router.use('/elementLives', utils.routerCRUD({Model: sqldb.ElementLive}));
router.use('/elementPersons', utils.routerCRUD({Model: sqldb.ElementPerson}));
router.use('/elementSeasons', utils.routerCRUD({Model: sqldb.ElementSeason}));
router.use('/elementSeries', utils.routerCRUD({Model: sqldb.ElementSerie}));

module.exports = router;
