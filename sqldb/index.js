/**
 * Sequelize initialization module
 */

'use strict';

var assert = require('better-assert');
var _ = require('lodash');
var path = require('path');
var config = rootRequire('/config');

var Sequelize = require('sequelize');

var hooks = require('./hooks');

var options = _.merge({}, config.sequelize.options, {
    define: {
        hooks: hooks
    }
});

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
        var getDstModel = function () {
            return db[options.dstModel];
        };

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
            data[linkColumnSrc] = srcId;
            data[linkColumnDst] = destId;
            return getLinkModel().update(
                updateValues,
                {where: where}
            );
        };

        var moveLinks = function (srcId, movedIdList, newDstModelIdList) {
            var tasks = movedIdList.map(function createTask (movedId) {
                return function task () {
                    var dstIndex = newDstModelIdList.indexOf(addedId);
                    return moveLink(srcId, addedId, dstIndex);
                }
            });
            return waterfall(tasks);
        };

        return function (dstModelList) {
            var srcModelInstance = this
                , linkModel = getLinkModel()
                , dstModel = getDstModel();//dstModel unused ???

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

module.exports = db;

db.AccessToken = db.sequelize.import('models/accessToken');
db.Actor = db.sequelize.import('models/actor');
db.Asset = db.sequelize.import('models/asset');
db.AuthCode = db.sequelize.import('models/authCode');
db.Broadcaster = db.sequelize.import('models/broadcaster');
db.Caption = db.sequelize.import('models/caption');
db.CatchupProvider = db.sequelize.import('models/catchupProvider');
db.Category = db.sequelize.import('models/category');
db.Client = db.sequelize.import('models/client');
db.Comment = db.sequelize.import('models/comment');
db.Country = db.sequelize.import('models/country');
db.Episode = db.sequelize.import('models/episode');
db.Genre = db.sequelize.import('models/genre');
db.GiftGiver = db.sequelize.import('models/giftGiver');
db.Image = db.sequelize.import('models/image');
db.Language = db.sequelize.import('models/language');
db.Licensor = db.sequelize.import('models/licensor');
db.Log = db.sequelize.import('models/logs');
db.Movie = db.sequelize.import('models/movie');
db.PFGroup = db.sequelize.import('models/pfGroup');
db.PFProfile = db.sequelize.import('models/pfProfile');
db.Post = db.sequelize.import('models/post');
db.RefreshToken = db.sequelize.import('models/refreshToken');
db.Season = db.sequelize.import('models/season');
db.Store = db.sequelize.import('models/store');
db.Tag = db.sequelize.import('models/tag');
db.User = db.sequelize.import('models/user');
db.Video = db.sequelize.import('models/video');
db.Config = db.sequelize.import('models/config');
db.Widget = db.sequelize.import('models/widget');
db.WaitingUser = db.sequelize.import('models/waitingUser');
db.WallNote = db.sequelize.import('models/wallNote');
db.WallNotesUsers = db.sequelize.import('models/wallNotesUsers');
db.Work = db.sequelize.import('models/work');

//LIFE
db.LifePin = db.sequelize.import('models/life/lifePin');
db.LifeTheme = db.sequelize.import('models/life/lifeTheme');
db.LifeThemePins = db.sequelize.import('models/life/lifeThemePins');
db.LifeUsersPins = db.sequelize.import('models/life/lifeUsersPins');
db.LifePin.belongsTo(db.Image, {as: 'image', constraints: false});

db.LifePin.belongsTo(db.User, {as: 'user', constraints: false});
db.LifePin.belongsToMany(db.User, {through: db.LifeUsersPins, as: 'users', foreignKey: 'lifePinId'});
db.LifePin.belongsToMany(db.LifeTheme, {through: db.LifeThemePins, as: 'themes', foreignKey: 'lifePinId'});
db.LifeTheme.belongsToMany(db.LifePin, {through: db.LifeThemePins, as: 'pins', foreignKey: 'lifeThemeId'});
db.User.belongsToMany(db.LifePin, {through: db.LifeUsersPins, as: 'lifePins', foreignKey: 'userId'});

//JOIN
db.Client.belongsTo(db.PFGroup, {as: 'pfGroup', constraints: false});

db.Broadcaster.belongsTo(db.Country, {as: 'defaultCountry', constraints: false});

db.WallNote.belongsTo(db.User, {as: 'user', foreignKey: 'userId'});
db.WallNote.belongsToMany(db.User, {through: db.WallNotesUsers, as: 'movies', foreignKey: 'wallNoteId'});
db.User.belongsToMany(db.WallNote, {through: db.WallNotesUsers, as: 'actors', foreignKey: 'userId'});

db.CategoryMovies = db.sequelize.import('models/categoryMovies');
db.CategoryAdSpots = db.sequelize.import('models/categoryAdSpots');
db.MoviesActors = db.sequelize.import('models/moviesActors.js');
db.UsersVideos = db.sequelize.import('models/usersVideos.js');
db.VideosComments = db.sequelize.import('models/videosComments.js');

db.Actor.belongsTo(db.Image, {as: 'picture', constraints: false});
db.Actor.belongsToMany(db.Movie, {through: db.MoviesActors, as: 'movies'});
db.Movie.belongsToMany(db.Actor, {through: db.MoviesActors, as: 'actors'});

db.Client.belongsTo(db.Broadcaster, {as: 'broadcaster', constraints: false});

db.Licensor.hasMany(db.Movie, {as: 'movies', foreignKey: 'licensorId'});
db.Movie.belongsTo(db.Licensor, {as: 'licensor', foreignKey: 'licensorId'});

db.Movie.belongsToMany(db.Category, {through: db.CategoryMovies, as: 'categorys'});
db.Category.belongsToMany(db.Movie, {through: db.CategoryMovies, as: 'movies'});
db.Category.belongsToMany(db.Movie, {through: db.CategoryAdSpots, as: 'adSpots'});

db.Movie.belongsTo(db.Image, {as: 'poster', constraints: false});
db.Movie.belongsTo(db.Image, {as: 'logo', constraints: false});
db.Movie.belongsTo(db.Image, {as: 'thumb', constraints: false});
db.Movie.belongsTo(db.Video, {as: 'video', constraints: false});

db.Movie.hasMany(db.Comment, {as: 'comments'});
db.Movie.hasMany(db.Tag, {as: 'tags'});
db.Comment.belongsTo(db.Movie, {as: 'movie', constraints: false});
db.Comment.belongsTo(db.Video, {as: 'video', constraints: false});

db.Movie.hasMany(db.Season, {as: 'seasons', foreignKey: 'movieId'});
db.Season.belongsTo(db.Movie, {as: 'movie', foreignKey: 'movieId', constraints: false});

db.Season.belongsTo(db.Image, {as: 'poster', constraints: false});
db.Season.belongsTo(db.Image, {as: 'thumb', constraints: false});

db.Season.hasMany(db.Episode, {as: 'episodes', foreignKey: 'seasonId'});
db.Episode.belongsTo(db.Season, {as: 'season', foreignKey: 'seasonId', constraints: false});

db.Episode.belongsTo(db.Image, {as: 'poster', constraints: false});
db.Episode.belongsTo(db.Image, {as: 'thumb', constraints: false});
db.Episode.belongsTo(db.Video, {as: 'video', constraints: false});

db.Video.hasMany(db.Caption, {as: 'captions', foreignKey: 'videoId'});
db.Caption.belongsTo(db.Video, {as: 'videos', foreignKey: 'videoId', constraints: false});

db.Video.hasOne(db.Movie, {as: 'movie', foreignKey: 'videoId'});
db.Video.hasOne(db.Episode, {as: 'episode', foreignKey: 'videoId'});

db.Caption.belongsTo(db.Language, {as: 'lang', foreignKey: 'langId', constraints: false});

db.UsersVideos.belongsTo(db.Video, {as: 'video', foreignKey: 'videoId', targetKey: '_id'});
db.UsersVideos.belongsTo(db.User, {as: 'user', foreignKey: 'userId', targetKey: '_id'});

db.VideosComments.belongsTo(db.Video, {as: 'video', foreignKey: 'videoId', targetKey: '_id'});
db.VideosComments.belongsTo(db.User, {as: 'user', foreignKey: 'userId', targetKey: '_id'});

db.PFGroupsProfiles = db.sequelize.import('models/pfGroupsProfiles');
db.PFProfile.belongsToMany(db.PFGroup, {through: db.PFGroupsProfiles, as: 'pfGroups', foreignKey: 'pfProfileId'});
db.PFGroup.belongsToMany(db.PFProfile, {through: db.PFGroupsProfiles, as: 'pfProfiles', foreignKey: 'pfGroupId'});

db.UsersFavoritesEpisodes = db.sequelize.import('models/usersFavoritesEpisodes');
db.Episode.belongsToMany(db.User, {through: db.UsersFavoritesEpisodes, as: 'users', foreignKey: 'episodeId'});
db.User.belongsToMany(db.Episode, {through: db.UsersFavoritesEpisodes, as: 'favoritesEpisodes', foreignKey: 'userId'});

db.UsersFavoritesMovies = db.sequelize.import('models/usersFavoritesMovies');
db.Movie.belongsToMany(db.User, {through: db.UsersFavoritesMovies, as: 'users', foreignKey: 'movieId'});
db.User.belongsToMany(db.Movie, {through: db.UsersFavoritesMovies, as: 'favoritesMovies', foreignKey: 'userId'});

db.UsersFavoritesSeasons = db.sequelize.import('models/usersFavoritesSeasons');
db.Season.belongsToMany(db.User, {through: db.UsersFavoritesSeasons, as: 'users', foreignKey: 'seasonId'});
db.User.belongsToMany(db.Season, {through: db.UsersFavoritesSeasons, as: 'favoritesSeasons', foreignKey: 'userId'});

db.Post.belongsTo(db.Image, {as: 'poster', constraints: false});

db.Video.belongsTo(db.CatchupProvider, {as: 'catchupProvider', foreignKey: 'catchupProviderId', constraints: false});
db.Episode.belongsTo(db.CatchupProvider, {as: 'catchupProvider', foreignKey: 'catchupProviderId', constraints: false});
db.Season.belongsTo(db.CatchupProvider, {as: 'catchupProvider', foreignKey: 'catchupProviderId', constraints: false});
db.Movie.belongsTo(db.CatchupProvider, {as: 'catchupProvider', foreignKey: 'catchupProviderId', constraints: false});

db.CatchupProvider.belongsTo(db.Category, {as: 'category', foreignKey: 'categoryId', constraints: false});
db.CatchupProvider.belongsTo(db.Licensor, {as: 'licensor', foreignKey: 'licensorId', constraints: false});

db.AccessToken.belongsTo(db.User, {as: 'user', foreignKey: 'userId', constraints: false});
db.AccessToken.belongsTo(db.Client, {as: 'client', foreignKey: 'clientId', targetKey: '_id', constraints: false});

db.Log.belongsTo(db.User, {as: 'user', foreignKey: 'userId', constraints: false});
db.Log.belongsTo(db.Client, {as: 'client', foreignKey: 'clientId', targetKey: '_id', constraints: false});

db.Widget.belongsTo(db.Image, {as: 'image', constraints: false});

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

/**
 * Add the field : { required: false } in all included submodels.
 *
 * @param options object              input query options (mutable)
 * @return        object              new options
 */
db.noInnerJoin = function (options) {
    return db.filterOptions(options, function (options, root) {
        if (root) {
            return options;
        }
        return _.merge(options, {required: false});
    });
};
