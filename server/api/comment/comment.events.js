/**
 * Comment model events
 */

'use strict';

var EventEmitter = require('events').EventEmitter;
var Comment = require('../../sqldb').Comment;
var CommentEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
CommentEvents.setMaxListeners(0);

// Model events
var events = {
  'afterCreate': 'save',
  'afterUpdate': 'save',
  'afterDestroy': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  Comment.hook(e, emitEvent(event));
}

function emitEvent(event) {
  return function(doc, options, done) {
    CommentEvents.emit(event + ':' + doc._id, doc);
    CommentEvents.emit(event, doc);
    done(null);
  }
}

module.exports = CommentEvents;
