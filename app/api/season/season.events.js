/**
 * Season model events
 */

'use strict';

const EventEmitter = require('events').EventEmitter;
const Season = rootRequire('sqldb').Season;
const SeasonEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
SeasonEvents.setMaxListeners(0);

// Model events
const events = {
  'afterCreate': 'save',
  'afterUpdate': 'save',
  'afterDestroy': 'remove'
};

// Register the event emitter to the model events
for (const e in events) {
  const event = events[e];
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
