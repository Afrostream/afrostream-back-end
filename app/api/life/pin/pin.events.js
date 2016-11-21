/**
 * LifePin model events
 */

'use strict';

const EventEmitter = require('events').EventEmitter;
const LifePin = rootRequire('sqldb').LifePin;
const LifePinEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
LifePinEvents.setMaxListeners(0);

// Model events
const events = {
    'afterCreate': 'save',
    'afterUpdate': 'save',
    'afterDestroy': 'remove'
};

// Register the event emitter to the model events
for (const e in events) {
    const event = events[e];
    LifePin.hook(e, emitEvent(event));
}

function emitEvent (event) {
    return (doc, options, done) => {
        LifePinEvents.emit(event + ':' + doc._id, doc);
        LifePinEvents.emit(event, doc);
        done(null);
    };
}

module.exports = LifePinEvents;
