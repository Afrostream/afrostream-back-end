/**
 * LifePin model events
 */

'use strict';

var EventEmitter = require('events').EventEmitter;
var LifeTheme = rootRequire('/sqldb').LifeTheme;
var LifeThemeEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
LifeThemeEvents.setMaxListeners(0);

// Model events
var events = {
    'afterCreate': 'save',
    'afterUpdate': 'save',
    'afterDestroy': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
    var event = events[e];
    LifeTheme.hook(e, emitEvent(event));
}

function emitEvent (event) {
    return function (doc, options, done) {
        LifeThemeEvents.emit(event + ':' + doc._id, doc);
        LifeThemeEvents.emit(event, doc);
        done(null);
    };
}

module.exports = LifeThemeEvents;
