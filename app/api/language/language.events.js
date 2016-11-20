/**
 * Language model events
 */

'use strict';

var EventEmitter = require('events').EventEmitter;
var Language = rootRequire('sqldb').Language;
var LanguageEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
LanguageEvents.setMaxListeners(0);

// Model events
var events = {
  'afterCreate': 'save',
  'afterUpdate': 'save',
  'afterDestroy': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  Language.hook(e, emitEvent(event));
}

function emitEvent(event) {
  return function(doc, options, done) {
    LanguageEvents.emit(event + ':' + doc._id, doc);
    LanguageEvents.emit(event, doc);
    done(null);
  };
}

module.exports = LanguageEvents;
