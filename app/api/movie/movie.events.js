/**
 * Movie model events
 */

'use strict';

var EventEmitter = require('events').EventEmitter;
var Movie = rootRequire('sqldb').Movie;
var MovieEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
MovieEvents.setMaxListeners(0);

// Model events
var events = {
  'afterCreate': 'save',
  'afterUpdate': 'save',
  'afterDestroy': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  Movie.hook(e, emitEvent(event));
}

function emitEvent(event) {
  return (doc, options, done) => {
    MovieEvents.emit(event + ':' + doc._id, doc);
    MovieEvents.emit(event, doc);
    done(null);
  };
}

module.exports = MovieEvents;
