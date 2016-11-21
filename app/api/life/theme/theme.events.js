/**
 * LifePin model events
 */

'use strict';

const EventEmitter = require('events').EventEmitter;
const LifeTheme = rootRequire('sqldb').LifeTheme;
const LifeThemeEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
LifeThemeEvents.setMaxListeners(0);

// Model events
const events = {
    'afterCreate': 'save',
    'afterUpdate': 'save',
    'afterDestroy': 'remove'
};

// Register the event emitter to the model events
for (const e in events) {
    const event = events[e];
    LifeTheme.hook(e, emitEvent(event));
}

function emitEvent (event) {
    return (doc, options, done) => {
        LifeThemeEvents.emit(event + ':' + doc._id, doc);
        LifeThemeEvents.emit(event, doc);
        done(null);
    };
}

module.exports = LifeThemeEvents;
