const express = require('express');
const router = express.Router();

const sqldb = rootRequire('sqldb');
const utils = rootRequire('/app/api/shared/rest/utils');

// CRUD
router.use('/items', require('./item'));
router.use('/elementCategories', utils.routerCRUD({model: sqldb.ElementCategory}));
router.use('/elementEpisodes', utils.routerCRUD({model: sqldb.ElementEpisode}));
router.use('/elementFilms', utils.routerCRUD({model: sqldb.ElementFilm}));
router.use('/elementLives', utils.routerCRUD({model: sqldb.ElementLive}));
router.use('/elementPersons', utils.routerCRUD({model: sqldb.ElementPerson}));
router.use('/elementSeasons', utils.routerCRUD({model: sqldb.ElementSeason}));
router.use('/elementSeries', require('./elementSerie'));

module.exports = router;
