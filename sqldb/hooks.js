'use strict';

/**
 * Hooks sequelize:
 *
 *   we push in the message queue every CREATE / UPDATE / DESTROY events.
 *
 * to avoid event flooding, we limit the messages to certain models
 * to avoid event flooding, we limit the data sent to the changes & _id field.
 */
var config = rootRequire('/config');

var mq = rootRequire('/mq');

var _ = require('lodash');

var isModelBlacklisted = function (modelName) {
  return config.sequelize.hooks.mqModelBlacklist.indexOf(modelName) !== -1;
};

var getPreviousValues = function (instance, fields) {
  var previousValues = {};
  for (var i = 0; i < fields.length; ++i) {
    previousValues[fields[i]] = instance.previous(fields[i]);
  }
  return previousValues;
};

var getDataValues = function (instance, fields) {
  var dataValues = {};
  for (var i = 0; i < fields.length; ++i) {
    dataValues[fields[i]] = instance.getDataValue(fields[i]);
  }
  return dataValues;
};

module.exports = {
  afterCreate: function (instance, options) {
    try {
      var modelName = options.model.name;
      if (isModelBlacklisted(modelName)) {
        //console.log('[HOOK]: [AFTERCREATE]: skip mq message ('+modelName+' is blacklisted)');
        return;
      }
      // sending only a selection of fields to avoid mq flooding
      var fields = _.intersection(config.sequelize.hooks.mqFields, Object.keys(options.model.attributes));
      //
      var message = {
        id: String(Date.now())+String(Math.round(Math.random()*100000)),
        type: 'model.created',
        date: new Date().toISOString(),
        data: {
          modelName: options.model.name,
          dataValues: getDataValues(instance, fields)
        }
      };
      //console.log('[HOOK]: [AFTERCREATE]: send '+ JSON.stringify(message) + ' to mq');
      mq.send(message);
    } catch (e) {
      console.error('[HOOK]: [AFTERCREATE]: ' + String(e), e.stack);
    }
  },
  afterUpdate: function (instance, options) {
    try {
      var modelName;

      if (!options.model) {
        console.log('[HOOK]: [AFTERUPDATE]: missing options.model => skip (' + JSON.stringify(options) + ')');
        return;
      }
      modelName = options.model.name;
      if (isModelBlacklisted(modelName)) {
        //console.log('[HOOK]: [AFTERUPDATE]: skip mq message ('+modelName+' is blacklisted)');
        return;
      }
      var changed = instance.changed() || [];
      // sending only a selection of fields to avoid mq flooding + changedFields
      var fields = _.intersection(config.sequelize.hooks.mqFields, Object.keys(options.model.attributes));
      fields = _.union(changed, fields);
      //
      var message = {
        id: String(Date.now())+String(Math.round(Math.random()*100000)),
        type: 'model.updated',
        date: new Date().toISOString(),
        data: {
          modelName: options.model.name,
          changed: changed,
          previousDataValues: getPreviousValues(instance, fields),
          dataValues: getDataValues(instance, fields)
        }
      };
      //console.log('[HOOK]: [AFTERUPDATE]: send '+ JSON.stringify(message) + ' to mq');
      mq.send(message);
    } catch (e) {
      console.error('[HOOK]: [AFTERUPDATE]: ' + String(e), e.stack);
    }
  },
  afterDestroy: function (instance, options) {
    try {
      var modelName = options.model.name;
      if (isModelBlacklisted(modelName)) {
        //console.log('[HOOK]: [AFTERDESTROY]: skip mq message ('+modelName+' is blacklisted)');
        return;
      }
      // sending only a selection of fields to avoid mq flooding
      var fields = _.intersection(config.sequelize.hooks.mqFields, Object.keys(options.model.attributes));
      //
      var message = {
        id: String(Date.now())+String(Math.round(Math.random()*100000)),
        type: 'model.destroyed',
        date: new Date().toISOString(),
        data: {
          modelName: options.model.name,
          dataValues: getDataValues(instance, fields)
        }
      };
      //console.log('[HOOK]: [AFTERDESTROY]: send '+ JSON.stringify(message) + ' to mq');
      mq.send(message);
    } catch (e) {
      console.error('[HOOK]: [AFTERDESTROY]: ' + String(e), e.stack);
    }
  }
};
