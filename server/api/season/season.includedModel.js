'use strict';

var sqldb = require('../../sqldb');
var Episode = sqldb.Episode;
var Movie = sqldb.Movie;
var Image = sqldb.Image;

var includedModel = [
  {
    model: Episode, as: 'episodes',
    order: [['sort', 'ASC']],
    include: [
      {model: Image, as: 'poster', required: false},
      {model: Image, as: 'thumb', required: false}
    ],
    required: false
  },
  {model: Movie, as: 'movie', required: false},
  {model: Image, as: 'poster', required: false},
  {model: Image, as: 'thumb', required: false}
];

module.exports = includedModel;