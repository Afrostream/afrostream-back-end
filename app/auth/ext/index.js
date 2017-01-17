/*
 * unsecured accessToken generation
 * used by chrome extension
 */

const express = require('express');
const router = express.Router();

//const Q = require('q');

router.get('/token', (req, res) => {
  res.json({fixme:'fixme'});
  /*
  Q()
    .then(() => {
      if (!req.query.secret) {
        const error = new Error('permission denied');
        error.statusCode = 401;
        throw error;
      }
      const email = req.query.email || 'tech@afrostream.tv';
      const clientId =
    });
    */
});

module.exports = router;
