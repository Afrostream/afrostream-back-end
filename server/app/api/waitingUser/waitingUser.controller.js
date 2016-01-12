'use strict';

var sqldb = rootRequire('/server/sqldb');
var WaitingUser = sqldb.WaitingUser;

exports.create = function (req, res, next) {
  var newWaitingUser = WaitingUser.build(req.body);
  newWaitingUser.set('country', req.country);
  newWaitingUser.save()
    .then(function (waitingUser) {
      res.json(waitingUser);
    })
    .catch(function (err) {
      console.error('error creating waiting user ', err);
      res.status(500).send();
    });
};
