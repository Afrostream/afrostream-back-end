/**
 * Category model events
 */

'use strict';

var EventEmitter = require('events').EventEmitter;
var Category = rootRequire('/server/sqldb').Category;
var CategoryEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
CategoryEvents.setMaxListeners(0);

// Model events
var events = {
  'afterCreate': 'save',
  'afterUpdate': 'save',
  'afterDestroy': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  Category.hook(e, emitEvent(event));
}

function emitEvent(event) {
  return function(doc, options, done) {
    CategoryEvents.emit(event + ':' + doc._id, doc);
    CategoryEvents.emit(event, doc);
    done(null);
  }
}

module.exports = CategoryEvents;
