/*
 * unsecured accessToken generation
 * used by chrome extension
 */

const express = require('express');
const router = express.Router();

const Q = require('q');
const sqldb = rootRequire('sqldb');
const Client = rootRequire('sqldb').Client;
const User = rootRequire('sqldb').User;
const oauth2 = rootRequire('app/auth/oauth2/oauth2');

router.get('/token', (req, res) => {
  Q()
    .then(() => {
      // fixme: security.
      if (req.query.secret != '4hrdDRT76mrzg!.#eA45Z4sdf') {
        const error = new Error('permission denied');
        error.statusCode = 401;
        throw error;
      }
      if (!req.query.clientId) {
        throw new Error('missing client id');
      }
      const email = req.query.email || 'tech@afrostream.tv';
      const clientId = req.query.clientId;
      return Q.all([
        Client.findOne({where:{_id: clientId}}),
        User.findOne({
          where : sqldb.sequelize.where(
            sqldb.sequelize.fn('lower', sqldb.sequelize.col('email')),
            sqldb.sequelize.fn('lower', email)
          )
        })
      ]);
    })
    .then(([client, user]) => {
      return Q.ninvoke(oauth2, 'generateToken', {
        req: req,
        res: res,
        client: client,
        user: user,
        code: null,
        userIp: '127.0.0.1',
        userAgent: 'ext-chrome',
        expireIn: 3600
      }).then(result => {
        return {
          accessToken: result[0],
          refreshToken: result[1],
          expires_in: result[2].expires_in
        };
      });
    })
    .then(
      res.json.bind(res),
      res.handleError()
    );
});

module.exports = router;
