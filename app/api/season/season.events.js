/**
 * Season model events
 */

'use strict';

var EventEmitter = require('events').EventEmitter;
var Season = rootRequire('sqldb').Season;
var SeasonEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
SeasonEvents.setMaxListeners(0);

// Model events
var events = {
  'afterCreate': 'save',
  'afterUpdate': 'save',
  'afterDestroy': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  Season.hook(e, emitEvent(event));
}

function emitEvent(event) {
  return (doc, options, done) => {
    SeasonEvents.emit(event + ':' + doc._id, doc);
    SeasonEvents.emit(event, doc);
    done(null);
  };
}

module.exports = SeasonEvents;
