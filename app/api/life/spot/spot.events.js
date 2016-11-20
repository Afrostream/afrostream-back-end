/**
 * LifeSpot model events
 */

'use strict';

var EventEmitter = require('events').EventEmitter;
var LifeSpot = rootRequire('/sqldb').LifeSpot;
var LifeSpotEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
LifeSpotEvents.setMaxListeners(0);

// Model events
var events = {
    'afterCreate': 'save',
    'afterUpdate': 'save',
    'afterDestroy': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
    var event = events[e];
    LifeSpot.hook(e, emitEvent(event));
}

function emitEvent (event) {
    return function (doc, options, done) {
        LifeSpotEvents.emit(event + ':' + doc._id, doc);
        LifeSpotEvents.emit(event, doc);
        done(null);
    };
}

module.exports = LifeSpotEvents;
