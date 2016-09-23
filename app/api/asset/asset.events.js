/**
 * Asset model events
 */

'use strict';

var EventEmitter = require('events').EventEmitter;
var Asset = rootRequire('/sqldb').Asset;
var AssetEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
AssetEvents.setMaxListeners(0);

// Model events
var events = {
  'afterCreate': 'save',
  'afterUpdate': 'save',
  'afterDestroy': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  Asset.hook(e, emitEvent(event));
}

function emitEvent(event) {
  return function(doc, options, done) {
    AssetEvents.emit(event + ':' + doc._id, doc);
    AssetEvents.emit(event, doc);
    done(null);
  }
}

module.exports = AssetEvents;
