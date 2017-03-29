'use strict';

const assert = require('assert');

const _ = require('lodash');
const sqldb = rootRequire('sqldb');
const Promise = sqldb.Sequelize.Promise;
const utils = require('./utils.js');

/**
 * resulting query parameters will be modified as :
 *
 * if (!backo) {
 *   options.where.active doesn't exist => result.where.active = true
 *   options.where.active = true        => result.where.active = true
 *   options.where.active = false       => result.where.active = false
 *   options.where.active = undefined   => result.where.active doesn't exist.
 * }
 *
 * if (!backo) {
 *   result.where.$or = [
 *     {dateFrom: null, dateTo: null},
 *     {dateFrom: null, dateTo: {$gt: now}},
 *     {dateTo: null, dateFrom: {$lt: now}},
 *     {dateFrom: {$lt: now}, dateTo: {$gt: now}}
 *   ]
 * }
 *
 * @param req       object
 * @param options   object query parameters
 * @param rootModel sequelize model
 * @return object new filtered options object
 */
const filterQueryOptions = (req, options, rootModel) => {
    assert(rootModel);

    const isBacko = utils.isReqFromAfrostreamAdmin(req);

    // opportunistic guess... (req.passport might not be loaded)
    const client = req.passport && req.passport.client;
    const isAfrostreamExportsBouygues = client && client.isAfrostreamExportsBouygues();
    const isAfrostreamExportsOsearch = client && client.isAfrostreamExportsOsearch();
    const isAfrostreamExportsOCI = client && client.isAfrostreamExportsOCI();
    const isAfrostreamExportsAlgolia = client && client.isAfrostreamExportsAlgolia();
    const isBouyguesMiami = client && client.isBouyguesMiami();
    const isOrange = client && client.isOrange();
    const isOrangeNewbox = client && client.isOrangeNewbox();
    //const isTapptic = client && client.isTapptic();

    return sqldb.filterOptions(options, function filter (options, root) {
        const model = root ? rootModel : options.model;

        if (isBacko ||
            isAfrostreamExportsBouygues ||
            isAfrostreamExportsOsearch ||
            isAfrostreamExportsOCI ||
            isAfrostreamExportsAlgolia
          ) {
            // no restrictions.
        } else {
            if (req.country &&
                model &&
                model.attributes &&
                model.attributes.countries &&
                req.query.filterCountry !== "false") {
                if (options && options.where && options.where.$or && options.where.$and) {
                    options.where.$and = {$and: options.where.$and, $or: options.where.$or};
                    delete options.where.$or;
                } else if (options && options.where && options.where.$or) {
                    options.where.$and = {$or: options.where.$or};
                    delete options.where.$or;
                }
                options = _.merge(options, {
                    where: {
                        $or: [
                            {countries: {$eq: []}},
                            {countries: {$eq: null}},
                            {countries: {$contains: [req.country._id]}}
                        ]
                    }
                });
            }

            if (req.country &&
                model &&
                model.attributes &&
                model.attributes.countriesOut &&
                req.query.filterCountry !== "false") {
                if (options && options.where && options.where.$or && options.where.$and) {
                    options.where.$and = {$and: options.where.$and, $or: options.where.$or};
                    delete options.where.$or;
                } else if (options && options.where && options.where.$or) {
                    options.where.$and = {$or: options.where.$or};
                    delete options.where.$or;
                }
                options = _.merge(options, {
                    where: {
                        $or: [
                            {countriesOut: {$eq: []}},
                            {countriesOut: {$eq: null}},
                            { $not: { countriesOut: { $contains: [req.country._id] } } }
                        ]
                    }
                });
            }

            if (req.broadcaster &&
                model &&
                model.attributes &&
                model.attributes.broadcasters) {
                if (options && options.where && options.where.$or && options.where.$and) {
                    options.where.$and = {$and: options.where.$and, $or: options.where.$or};
                    delete options.where.$or;
                } else if (options && options.where && options.where.$or) {
                    options.where.$and = {$or: options.where.$or};
                    delete options.where.$or;
                }
                options = _.merge(options, {
                    where: {
                        $or: [
                            {broadcasters: {$eq: []}},
                            {broadcasters: {$eq: null}},
                            {broadcasters: {$contains: [req.broadcaster._id]}}
                        ]
                    }
                });
            }

            if (model &&
                model.attributes &&
                model.attributes.active) {
                // we can set modify the "active" parameter
                if (options.where && options.where.hasOwnProperty('active')) {
                    // sub model
                    switch (options.where.active) {
                        case undefined:
                            delete options.where.active;
                            break;
                        case true:
                        case false:
                        default:
                            break;
                    }
                } else {
                    options = _.merge(options, {where: {active: true}});
                }
            }
            if (model &&
                model.attributes &&
                model.attributes.dateFrom && model.attributes.dateTo) {
                if (options && options.where && options.where.$or && options.where.$and) {
                    options.where.$and = {$and: options.where.$and, $or: options.where.$or};
                    delete options.where.$or;
                } else if (options && options.where && options.where.$or) {
                    options.where.$and = {$or: options.where.$or};
                    delete options.where.$or;
                }
                // dateFrom & dateTo generic
                const now = new Date();
                options = _.merge(options, {
                    where: {
                        // (dateFrom is null and dateTo is null) OR
                        // (dateFrom is null and dateTo > Date.now()) OR
                        // (dateTo is null and dateFrom < Date.now()) OR
                        // (dateFrom < Date.now() AND dateTo > Date.now())
                        $or: [
                            {dateFrom: null, dateTo: null},
                            {dateFrom: null, dateTo: {$gt: now}},
                            {dateTo: null, dateFrom: {$lt: now}},
                            {dateFrom: {$lt: now}, dateTo: {$gt: now}}
                        ]
                    }
                });
            }
        }
        //
        if (isBouyguesMiami || isOrange || isOrangeNewbox) {
            if (model &&
                model.attributes &&
                model.attributes.live) {
                options = _.merge(options, {where: {live: {$ne: true}}});
            }
        }
        // tempfix: desactivation des contenus BET sur orange
        if (isOrange || isOrangeNewbox) {
            if (model && model.name === 'Category') {
                options = _.merge(options, {where: {label: {$ne: 'BET'}}});
            }
            if (model &&
                model.attributes &&
                model.attributes.genre) {
                options = _.merge(options, {where: {genre: {$ne: 'BET'}}});
            }
        }
        //
        if (root && !options.order) {
            options.order = [['_id', 'ASC']];
        }
        return options;
    });
};

function filterUserRecursive (entity, role, attribute) {
    let roleMehod = 'getPublicInfos';
    if (role === 'private') {
        roleMehod = 'getInfos';
    }
    const c = entity.get({plain: true});
    if (attribute) {
        const entityR = entity[attribute];
        c[attribute] = (entityR || []).map(entityD => {
            const p = entityD.get({plain: true});
            if (entityD.user) {
                p.user = entityD.user[roleMehod]();
            }
            if (entityD.users) {
                p.users = (entityD.users || []).map(user => user[roleMehod]());
            }
            return p;
        });
        return c;
    } else {
        return entity[roleMehod]();
    }
}

const filterUserAttributesAll = (req, role, attr) => {
    assert(role);
    const attributes = attr || [];
    const isBacko = utils.isReqFromAfrostreamAdmin(req);
    return entitys => {
        if (isBacko) {
            return entitys; // no restrictions.
        }

        const promises = [];
        const entityList = entitys.rows || [entitys];
        (entityList || []).map(entity => {
            if (!attributes.length) {
                promises.push(new Promise(resolve => {
                    const c = filterUserRecursive(entity, role);
                    resolve(c);
                }));
            } else {
                _.map(attributes, attribute => {
                    promises.push(new Promise(resolve => {
                        const c = filterUserRecursive(entity, role, attribute);
                        resolve(c);
                    }));
                });
            }
        });

        return Promise
            .all(promises)
            .then(entityFiltered => ({
            count: entityFiltered.length,
            rows: entityFiltered
        }));
    };
};

const filterUserAttributes = (req, role, attr) => {
    assert(role);
    const attributes = attr || [];
    const isBacko = utils.isReqFromAfrostreamAdmin(req);
    return entity => {
        if (isBacko) {
            return entity; // no restrictions.
        }
        if (!attributes.length) {
            return filterUserRecursive(entity, role);
        } else {
            const c = entity.get({plain: true});
            _.map(attributes, attribute => {
                _.merge(c, filterUserRecursive(entity, role, attribute));
            });
            return c;
        }

    };
};

/*
 * @param options [OPTIONNAL] object
 *     /!\ this param can be mutated.
 * @return function filtering & mutating an entity.
 */
const filterOutput = (() => {
  const filter = (entity, options) => {
    // loop
    if (Array.isArray(entity)) {
      return entity.map(v => filter(v, options));
    }
    // single entity
    if (typeof entity.getPlain === 'function') {
      return entity.getPlain(options);
    }
    return entity;
  };

  //
  return (data, options) => {
    options = options || {};
    options.caller = options.caller ||
                     options.req && options.req.user ||
                     options.req && options.req.passport && options.req.passport.user;
    options.language = options.language ||
                       options.req && options.req.query.language;
    return filter(data, options);
  };
})();

// FIXME: USER_PRIVACY: we should implement here a global output filter
exports.filterOutput = filterOutput;
exports.filterQueryOptions = filterQueryOptions;
exports.filterUserAttributesAll = filterUserAttributesAll;
exports.filterUserAttributes = filterUserAttributes;
