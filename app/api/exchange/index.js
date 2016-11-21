'use strict';

const express = require('express');
const router = express.Router();

// routes cannot be cached
router.use((req, res, next) => {
  res.noCache();
  next();
});

router.use('/bachat', require('./bachat'));

module.exports = router;
