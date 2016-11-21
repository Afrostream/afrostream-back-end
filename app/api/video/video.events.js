/**
 * Video model events
 */

'use strict';

const EventEmitter = require('events').EventEmitter;
const Video = rootRequire('sqldb').Video;
const VideoEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
VideoEvents.setMaxListeners(0);

// Model events
const events = {
  'afterCreate': 'save',
  'afterUpdate': 'save',
  'afterDestroy': 'remove'
};

// Register the event emitter to the model events
for (const e in events) {
  const event = events[e];
  Video.hook(e, emitEvent(event));
}

function emitEvent(event) {
  return (doc, options, done) => {
    VideoEvents.emit(event + ':' + doc._id, doc);
    VideoEvents.emit(event, doc);
    done(null);
  };
}

module.exports = VideoEvents;
