/**
 * Sequelize initialization module
 */

'use strict';

var assert = require('better-assert');
var _ = require('lodash');
var config = rootRequire('config');

var Sequelize = require('sequelize');

var hooks = require('./hooks');

const logger = rootRequire('logger').prefix('SQLDB');

var options = _.merge({}, config.sequelize.options, {
    define: {
        hooks: hooks,
        instanceMethods: {
          /*
           * Multi Language
           * mutate the object, override every column content with translation content
           *
           * search in Table.translations (json) fields
           *   { columnName: { language: value } }
           * ex: movie.title = "2001 l'odyssée de l'espace"
           *     movie.translations = { title: { EN: "2001 space odyssey" }}
           *
           *     movie.applyTranslation('DE');
           *     console.log(movie.title) // 2001 l'odyssée de l'espace
           *
           *     movie.applyTranslation('EN');
           *     console.log(movie.title) // 2001 space odyssey
           */
          applyTranslation: function (language) {
            const translations = this.getDataValue('translations');
            // translations = { columnName : { language : value } }
            if (translations) {
              Object.keys(translations)
                .filter(columnName => {
                  return translations[columnName] &&
                         translations[columnName][language];
                })
                .forEach(columnName => {
                  this.setDataValue(columnName, translations[columnName][language]);
                });
            }
          }
        }
    }
});

var Q = require('q');

var db = {
    Sequelize: Sequelize,
    sequelize: new Sequelize(config.sequelize.uri, options),
    /**
     * this version of sequelize "3.10.0" cannot work with postgresql 9.5
     * problem with autocommit feature (ex: findOrCreate)
     * [error: unrecognized configuration parameter "autocommit"]
     * @see https://github.com/sequelize/sequelize/issues/4631
     * until we bump sequelize, we implement a non atomic find or create
     */
    nonAtomicFindOrCreate: function (model, queryOptions) {
        return model.findOne({where: queryOptions.where})
            .then(function (instance) {
                if (instance) {
                    return [instance];
                }
                return model.create(_.merge({}, queryOptions.default, queryOptions.where)).then(function (m) {
                    return [m, true];
                });
            });
    },

    /**
     * This methods allows to create an instanceMethod used for database N-N ordered links
     *
     * usage :
     *
     *  // model definition
     *  var Category = sequelize.define('Category', { }, {
         *    instanceMethods: {
         *      setMoviesOrdered: sqldb.generateInstanceMethodSetXOrdered({
         *        // mandatory
         *        linkModel: 'CategoryMovies',
         *        linkColumnSrc: 'CategoryId',
         *        linkColumnDst: 'MovieId',
         *        linkColumnSrcIndex: 'movieOrder',
         *        linkColumnDstIndex: 'categoryOrder',
         *        dstModel: 'Movie',
         *        // optional
         *        srcIdColumn: '_id',
         *        dstIdColumn: '_id'
         *      })
         *    }
         *  });
     *
     * Category.findById(42).then(function (category) {
         *   category.setMoviesOrdered(movies);
         * });
     *
     * tricky: updating manually the liaison,
     * we cannot use setCategorys(categorys) without loosing the order.
     *
     * ex:
     *     +-------------------------------------------+
     *     |MovieId|CategoryId|categoryOrder|movieOrder|
     *     +-------------------------------------------+
     *     |  42   |   42     |   1         |  8       |
     *     |  42   |   43     |   2         |  12      |
     *     |  42   |   45     |   3         |  2       |
     *     |       |          |             |          |
     *     +-------+----------+-------------+----------+
     *
     * removing category 43, adding category 46 as last one
     *
     *     +-------------------------------------------+
     *     |MovieId|CategoryId|categoryOrder|movieOrder|
     *     +-------------------------------------------+
     *     |  42   |   42     |   1         |  8       |
     *     |  42   |   45     |   2         |  2       |
     *     |  42   |   46     |   3         |  max     |
     *     |       |          |             |          |
     *     +-------+----------+-------------+----------+
     *
     */
    generateInstanceMethodSetXOrdered: function (options) {
        assert(options);
        assert(typeof options.linkModel === 'string');
        assert(typeof options.linkColumnSrc === 'string');
        assert(typeof options.linkColumnDst === 'string');
        assert(typeof options.linkColumnSrcIndex === 'string');
        assert(typeof options.linkColumnDstIndex === 'string');
        assert(typeof options.dstModel === 'string');

        var srcIdColumn = options.srcIdColumn || '_id'
            , dstIdColumn = options.dstIdColumn || '_id'
            , linkColumnSrc = options.linkColumnSrc
            , linkColumnDst = options.linkColumnDst
            , linkColumnSrcIndex = options.linkColumnSrcIndex
            , linkColumnDstIndex = options.linkColumnDstIndex;

        var dstModelToDstId = function (m) {
            return m.get(dstIdColumn);
        };
        var linkModelToDstId = function (m) {
            return m.get(linkColumnDst);
        };

        var getLinkModel = function () {
            return db[options.linkModel];
        };
        /* never used ?
        var getDstModel = function () {
            return db[options.dstModel];
        };
        */

        // take an array of function, call the functions sequentially.
        function waterfall (functions) {
            return functions.reduce(function (p, f) {
                return p.then(f);
            }, Q());
        }

        // remove N links rows
        var removeLinks = function (srcId, dstIdList) {
            var where = {};
            where[linkColumnSrc] = srcId;
            where['$or'] = dstIdList.map(function (dstId) {
                var where = {};
                where[linkColumnDst] = dstId;
                return where;
            });
            return getLinkModel().destroy({where: where});
        };

        var addLink = function (srcId, addedId, dstIndex) {
            var where = {};
            where[linkColumnDst] = addedId;

            return getLinkModel()
                .max(linkColumnSrcIndex, {where: where})
                .then(function (maxSrcIndex) {
                    maxSrcIndex = !isNaN(Number(maxSrcIndex)) ? Number(maxSrcIndex) + 1 : 0;
                    var data = {};
                    data[linkColumnSrc] = srcId;
                    data[linkColumnDst] = addedId;
                    data[linkColumnSrcIndex] = maxSrcIndex;
                    data[linkColumnDstIndex] = dstIndex;
                    return getLinkModel().create(data);
                });
        };

        var addLinks = function (srcId, addedIdList, newDstModelIdList) {
            var tasks = addedIdList.map(function createTask (addedId) {
                return function task () {
                    var dstIndex = newDstModelIdList.indexOf(addedId);
                    return addLink(srcId, addedId, dstIndex);
                };
            });
            return waterfall(tasks);
        };

        var moveLink = function (srcId, destId, dstIndex) {
            var updateValues = {};
            var where = {};
            updateValues[linkColumnDstIndex] = dstIndex;
            updateValues[linkColumnSrc] = srcId;
            updateValues[linkColumnDst] = destId;
            return getLinkModel().update(
                updateValues,
                {where: where}
            );
        };

        var moveLinks = function (srcId, movedIdList, newDstModelIdList) {
            var tasks = movedIdList.map(function createTask (movedId) {
                return function task () {
                    var dstIndex = newDstModelIdList.indexOf(movedId);
                    return moveLink(srcId, movedId, dstIndex);
                };
            });
            return waterfall(tasks);
        };

        return function (dstModelList) {
            var srcModelInstance = this
                , linkModel = getLinkModel();
                //, dstModel = getDstModel();//dstModel unused ???

            // src list id
            var newDstModelIdList = dstModelList.map(dstModelToDstId);

            // src id
            var srcId = srcModelInstance.get(srcIdColumn);

            // searching old target ids
            var where = {};
            where[linkColumnSrc] = srcId;
            return linkModel.findAll({where: where}).then(function (linkModels) {
                var oldDstModelIdList = linkModels.map(linkModelToDstId);

                // debug
                console.log('old = ', oldDstModelIdList, ' new = ', newDstModelIdList);

                // optim
                if (_.isEqual(oldDstModelIdList, newDstModelIdList)) {
                    console.log('nothing to do');
                    return;
                }

                //
                var removedIdList = _.difference(oldDstModelIdList, newDstModelIdList);
                var addedIdList = _.difference(newDstModelIdList, oldDstModelIdList);
                var movedIdList = _.intersection(oldDstModelIdList, newDstModelIdList); // fixme: could be optimized

                //
                var tasks = [];
                if (removedIdList.length) {
                    tasks.push(function () {
                        return removeLinks(srcId, removedIdList);
                    });
                }
                if (addedIdList.length) {
                    // create task: add all associations movie<->category with category in removedCategorysIds
                    tasks.push(function () {
                        return addLinks(srcId, addedIdList, newDstModelIdList);
                    });
                }
                if (movedIdList.length) {
                    tasks.push(function () {
                        return moveLinks(srcId, movedIdList, newDstModelIdList);
                    });
                }
                return waterfall(tasks);
            });
        };
    }
};

/*
 * Monkey Patching Sequelize
 */
 /*
db.sequelize.Instance.prototype.getPlain = function (key, options) {
    if (options === undefined && typeof key === 'object') {
        options = key;
        key = undefined;
    }

    // recuperation d'une seule property
    if (key) {
        // soit c'est un getter custom
        if (this._customGetters[key]) {
            return this._customGetters[key].call(this, key);
        }
        // soit c'est un include (sous modele)
        if (this.$options.include && this.$options.includeNames.indexOf(key) !== -1) {
            if (Array.isArray(this.dataValues[key])) {
                return this.dataValues[key].map(function (instance) {
                    return instance.getPlain(options);
                });
            } else if (this.dataValues[key] instanceof db.sequelize.Instance) {
                return this.dataValues[key].getPlain(options);
            } else {
                // quel cas ?
                return this.dataValues[key];
            }
        }
        // soit c'est une property de base
        return this.dataValues[key];
    }

    // recuperation de la liste des properties de l'instance
    var values = {}, toPlainValues = null, _key;

    if (typeof this.toPlain === 'function') {
        // gestion manuelle de la sérialisation :
        //   on récupère les champs/value qui peuvent être sérialisés
        toPlainValues = this.toPlain(options);
    }
    if (toPlainValues) {
        for (_key in toPlainValues) {
            values[_key] = toPlainValues[_key];
        }
        // on récupère éventuellement les sous objets !
        //   sauf si ils ont été définis (null) dans toPlain
        for (_key in this.dataValues) {
            if (!values.hasOwnProperty(_key) &&
                this.dataValues.hasOwnProperty(_key) &&
                this.$options.include && this.$options.includeNames.indexOf(_key) !== -1) {
                values[_key] = this.getPlain(_key, options);
            }
        }
    } else {
        // recuperation des getters customs
        if (this._hasCustomGetters) {
            for (_key in this._customGetters) {
                if (this._customGetters.hasOwnProperty(_key)) {
                    values[_key] = this.getPlain(_key, options);
                }
            }
        }
        // autres properties
        for (_key in this.dataValues) {
            if (!values.hasOwnProperty(_key) && this.dataValues.hasOwnProperty(_key)) {
                values[_key] = this.getPlain(_key, options);
            }
        }
    }
    return values;
};
*/
module.exports = db;

const SequelizeHelper = require('afrostream-node-sequelize-helper');
db.helper = new SequelizeHelper({sequelize: db.sequelize, logger: logger});
db.models = db.helper.loadModelsFromDirectory(__dirname+'/models');

// backward compatibility
Object.keys(db.models).forEach(modelName => {
  db[modelName] = db.models[modelName];
});

db.helper.associateModels(`
  ## LIAISON 1-1 (belongsTo)
  # V2
  ElementCategory -> Item        foreignKey:_id
  ElementEpisode  -> Item        foreignKey:_id
  ElementEpisode  -> ElementSeason
  ElementEpisode  -> Licensor
  ElementFilm     -> Item        foreignKey:_id
  ElementLive     -> Item        foreignKey:_id
  ElementPerson   -> Item        foreignKey:_id
  ElementSeason   -> Item        foreignKey:_id
  ElementSeason   -> ElementSerie
  ElementSerie    -> Item        foreignKey:_id
  ElementSerie    -> Licensor
  # V1 - Life
  LifePin         -> Image
  LifePin         -> User
  LifeSpot        -> Image
  # V1
  AccessToken     -> User
  AccessToken     -> Client      targetKey:_id
  Actor           -> Image
  Broadcaster.defaultCountry     -> Country
  Caption.lang    -> Language
  CatchupProvider -> Category
  CatchupProvider -> Licensor
  Client.pfGroup  -> PFGroup
  Client          -> Broadcaster
  Comment         -> Movie
  Comment         -> Video
  Episode         -> Season
  Episode.poster  -> Image
  Episode.thumb   -> Image
  Episode         -> Video
  Episode         -> CatchupProvider
  Log             -> User
  Log             -> Client
  Movie           -> Licensor
  Movie -> CatchupProvider
  Movie.poster -> Image
  Movie.logo -> Image
  Movie.thumb -> Image
  Movie.video -> Video
  Post.poster -> Image
  Press.pdf -> Image
  Press -> Image
  Season->Movie
  Season.poster -> Image
  Season.thumb -> Image
  Season -> CatchupProvider
  UsersVideos -> Video
  UsersVideos -> User
  Video -> CatchupProvider
  VideosComments -> Video
  VideosComments -> User
  Widget -> Image
  WallNote        -> User

  # Liaisons 1-N (hasMany)
  ## V2
  ElementSeason.episodes[] -> ElementEpisode
  ElementSerie.seasons[] -> ElementSeason
  # V1
  User.lifePins[] -> LifePin
  Licensor.movies[] -> Movie
  Movie.comments[] -> Comment
  Movie.tags[] -> Tag
  Movie.seasons[] -> Season
  Season.episodes[] -> Episode
  Video.captions[] -> Caption

  # Liaonsns N-N (belongsToMany)
  ## V2
  ElementCategory.items[]  -> AssoItemsCategories -> Item
  Item.elementCategories[] -> AssoItemsCategories -> ElementCategory
  ## V1 - Life
  LifePin.themes[] -> LifeThemePins -> LifeTheme
  LifeTheme.pins[] -> LifeThemePins -> LifePin
  LifeSpot.themes[] -> LifeThemeSpots -> LifeTheme
  LifeTheme.spots[] -> LifeThemeSpots -> LifeSpot
  ## V1
  Actor.movies[] -> MoviesActors -> Movie
  Movie.actors[] -> MoviesActors -> Actor

  Movie.categorys[] -> CategoryMovies -> Category
  Category.movies[]  -> CategoryMovies  -> Movie
  Category.adspots[] -> CategoryAdSpots -> Movie

  User.favoritesEpisodes[] -> UsersFavoritesEpisodes -> Episode
  User.favoritesMovies[]   -> UsersFavoritesMovies   -> Movie
  User.favoritesSeasons[]  -> UsersFavoritesSeasons  -> Season
`);

///// HELPERS FUNCTIONS /////

db._filterOptionsRec = function (options, obj, root) {
    if (Array.isArray(options.include)) {
        options.include = options.include.map(function (subOptions) {
            return db._filterOptionsRec(subOptions, obj);
        });
    }
    if (typeof obj === 'function') {
        return obj(options, (root === true)); // filter function
    }
    return _.merge(options, obj);
};

//
// @param options object             input options (mutable)
// @param o       object|function    input mutator
// @return        object             new options
//
// example:
// db.filterOptions({ where: { id: 42 }, include: [ { model: Foo } ] }, { required: false });
//  => { where: { id: 42 }, include: [ { model: Foo, required: false } ], required: false }
// db.filterOptions(options, function (options, root) { options.foo = 'bar'; return options; }
//  =>
db.filterOptions = function (options, obj) {
    return db._filterOptionsRec(options, obj, true);
};

// v2 - OLD

//db.elements = { /* type: { model, modelName, elementName} */ };
/*
const createElement = function (type, name, file) {
  const elementName = name.charAt(0).toLowerCase() + name.slice(1);
  // standard assignement
  // db[name] = db.sequelize.import(file);
  // element.item
  db[name].belongsTo(db.Item, { as: 'item', foreignKey: '_id', targetKey: '_id'});
  // item.elementName
  db.Item.hasOne(db[name], {as: elementName, foreignKey: '_id', targetKey: '_id'});
  //
  db.elements[type] = {
    model: db[name],
    modelName: name,
    elementName: elementName
  };
};

createElement('category', 'ElementCategory', 'models/elementCategory');
createElement('episode', 'ElementEpisode', 'models/elementEpisode');
createElement('film', 'ElementFilm', 'models/elementFilm');
createElement('live', 'ElementLive', 'models/elementLive');
createElement('person', 'ElementPerson', 'models/elementPerson');
createElement('season', 'ElementSeason', 'models/elementSeason');
createElement('serie', 'ElementSerie', 'models/elementSerie');
*/
