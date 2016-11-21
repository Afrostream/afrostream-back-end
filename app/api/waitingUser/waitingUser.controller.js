'use strict';

const sqldb = rootRequire('sqldb');
const WaitingUser = sqldb.WaitingUser;

exports.create = (req, res) => {
  const newWaitingUser = WaitingUser.build(req.body);
  newWaitingUser.set('country', req.country);
  newWaitingUser.save()
    .then(waitingUser => {
      res.json(waitingUser);
    })
    .catch(res.handleError());
};
