/**
 * Client model events
 */

'use strict';

var EventEmitter = require('events').EventEmitter;
var Widget = rootRequire('/sqldb').Widget;
var WidgetEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
WidgetEvents.setMaxListeners(0);

// Model events
var events = {
  'afterCreate': 'save',
  'afterUpdate': 'save',
  'afterDestroy': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  Widget.hook(e, emitEvent(event));
}

function emitEvent (event) {
  return function (doc, options, done) {
    WidgetEvents.emit(event + ':' + doc._id, doc);
    WidgetEvents.emit(event, doc);
    done(null);
  }
}

module.exports = WidgetEvents;
