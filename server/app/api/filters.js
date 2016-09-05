'use strict';

var assert = require('assert');

var _ = require('lodash');
var sqldb = rootRequire('/server/sqldb');

/**
 * Tels if the request provider is the backoffice GUI.
 * @param req
 * @returns {*}
 */
function isQueryFromBacko (req) {
  return req.query.backo;
}

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
var filterQueryOptions = function (req, options, rootModel) {
  assert(rootModel);

  var isBacko = isQueryFromBacko(req);

  // opportunistic guess... (req.passport might not be loaded)
  var client = req.passport && req.passport.client;
  var isAfrostreamExportsBouygues = client && client.isAfrostreamExportsBouygues();
  var isAfrostreamExportsOsearch = client && client.isAfrostreamExportsOsearch();
  var isBouyguesMiami = client && client.isBouyguesMiami();
  var isOrange = client && client.isOrange();
  var isOrangeNewbox = client && client.isOrangeNewbox();

  return sqldb.filterOptions(options, function filter (options, root) {
    var model = root ? rootModel : options.model;

    if (isBacko || isAfrostreamExportsBouygues || isAfrostreamExportsOsearch) {
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
                { countries: { $eq: [] } },
                { countries: { $eq: null } },
                { countries: { $contains: [ req.country._id ] } }
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
                { broadcasters: { $eq: [] } },
                { broadcasters: { $eq: null } },
                { broadcasters: { $contains: [ req.broadcaster._id ] } }
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
        var now = new Date();
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
        options = _.merge(options, {where: {live: { $ne: true }}});
      }
    }
    // tempfix: desactivation des contenus BET sur orange
    if (isOrange || isOrangeNewbox) {
      if (model && model.name === 'Category') {
        options = _.merge(options, {where: {label: { $ne: 'BET' }}});
      }
      if (model &&
        model.attributes &&
        model.attributes.genre) {
        options = _.merge(options, {where: {genre: { $ne: 'BET' }}});
      }
    }
    //
    if (root && !options.order) {
      options.order = [['_id', 'ASC']];
    }
    return options;
  });
};

// FIXME: USER_PRIVACY: we should implement here a global output filter

exports.filterQueryOptions = filterQueryOptions;
