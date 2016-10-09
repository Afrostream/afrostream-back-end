/**
 * LifePin model events
 */

'use strict';

var EventEmitter = require('events').EventEmitter;
var MovLifePinie = rootRequire('/sqldb').LifePin;
var LifePinEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
LifePinEvents.setMaxListeners(0);

// Model events
var events = {
    'afterCreate': 'save',
    'afterUpdate': 'save',
    'afterDestroy': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
    var event = events[e];
    LifePin.hook(e, emitEvent(event));
}

function emitEvent (event) {
    return function (doc, options, done) {
        LifePinEvents.emit(event + ':' + doc._id, doc);
        LifePinEvents.emit(event, doc);
        done(null);
    }
}

module.exports = LifePinEvents;
