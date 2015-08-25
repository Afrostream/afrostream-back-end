/**
 * Plan model events
 */

'use strict';

var EventEmitter = require('events').EventEmitter;
var Plan = require('../../sqldb').Plan;
var PlanEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
PlanEvents.setMaxListeners(0);

// Model events
var events = {
  'afterCreate': 'save',
  'afterUpdate': 'save',
  'afterDestroy': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  Plan.hook(e, emitEvent(event));
}

function emitEvent(event) {
  return function(doc, options, done) {
    PlanEvents.emit(event + ':' + doc._id, doc);
    PlanEvents.emit(event, doc);
    done(null);
  }
}

module.exports = PlanEvents;
