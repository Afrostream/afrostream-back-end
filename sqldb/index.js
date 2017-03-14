/**
 * Sequelize initialization module
 */
const assert = require('better-assert');
const _ = require('lodash');
const config = rootRequire('config');

const Sequelize = require('sequelize');

const hooks = require('./hooks');

const logger = rootRequire('logger').prefix('SQLDB');
const fs = require('fs');

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

module.exports = db;

const SequelizeHelper = require('afrostream-node-sequelize-helper');
db.helper = new SequelizeHelper({sequelize: db.sequelize, logger: logger});
db.models = db.helper.loadModelsFromDirectory(__dirname+'/models');

// backward compatibility
Object.keys(db.models).forEach(modelName => {
  db[modelName] = db.models[modelName];
});

const associations = fs.readFileSync(__dirname + '/associations.md').toString();
db.helper.associateModels(associations);
