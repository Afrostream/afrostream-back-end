'use strict';

var sqldb = rootRequire('sqldb');
var WaitingUser = sqldb.WaitingUser;

exports.create = (req, res) => {
  var newWaitingUser = WaitingUser.build(req.body);
  newWaitingUser.set('country', req.country);
  newWaitingUser.save()
    .then(waitingUser => {
      res.json(waitingUser);
    })
    .catch(res.handleError());
};
