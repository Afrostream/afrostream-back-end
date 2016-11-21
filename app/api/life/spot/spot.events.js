/**
 * LifeSpot model events
 */

'use strict';

const EventEmitter = require('events').EventEmitter;
const LifeSpot = rootRequire('sqldb').LifeSpot;
const LifeSpotEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
LifeSpotEvents.setMaxListeners(0);

// Model events
const events = {
    'afterCreate': 'save',
    'afterUpdate': 'save',
    'afterDestroy': 'remove'
};

// Register the event emitter to the model events
for (const e in events) {
    const event = events[e];
    LifeSpot.hook(e, emitEvent(event));
}

function emitEvent (event) {
    return (doc, options, done) => {
        LifeSpotEvents.emit(event + ':' + doc._id, doc);
        LifeSpotEvents.emit(event, doc);
        done(null);
    };
}

module.exports = LifeSpotEvents;
