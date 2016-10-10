/**
 * Caption model events
 */

'use strict';

var EventEmitter = require('events').EventEmitter;
var Caption = rootRequire('/sqldb').Caption;
var CaptionEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
CaptionEvents.setMaxListeners(0);

// Model events
var events = {
  'afterCreate': 'save',
  'afterUpdate': 'save',
  'afterDestroy': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  Caption.hook(e, emitEvent(event));
}

function emitEvent(event) {
  return function(doc, options, done) {
    CaptionEvents.emit(event + ':' + doc._id, doc);
    CaptionEvents.emit(event, doc);
    done(null);
  }
}

module.exports = CaptionEvents;