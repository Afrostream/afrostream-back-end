/**
 * Episode model events
 */

'use strict';

var EventEmitter = require('events').EventEmitter;
var Episode = rootRequire('/sqldb').Episode;
var EpisodeEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
EpisodeEvents.setMaxListeners(0);

// Model events
var events = {
  'afterCreate': 'save',
  'afterUpdate': 'save',
  'afterDestroy': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  Episode.hook(e, emitEvent(event));
}

function emitEvent(event) {
  return function(doc, options, done) {
    EpisodeEvents.emit(event + ':' + doc._id, doc);
    EpisodeEvents.emit(event, doc);
    done(null);
  }
}

module.exports = EpisodeEvents;
