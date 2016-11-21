/**
 * Movie model events
 */

'use strict';

const EventEmitter = require('events').EventEmitter;
const Movie = rootRequire('sqldb').Movie;
const MovieEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
MovieEvents.setMaxListeners(0);

// Model events
const events = {
  'afterCreate': 'save',
  'afterUpdate': 'save',
  'afterDestroy': 'remove'
};

// Register the event emitter to the model events
for (const e in events) {
  const event = events[e];
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
