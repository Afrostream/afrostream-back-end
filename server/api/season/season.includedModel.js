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
      {model: Image, as: 'poster'},
      {model: Image, as: 'thumb'}
    ]
  },
  {model: Movie, as: 'movie'},
  {model: Image, as: 'poster'},
  {model: Image, as: 'thumb'}
];

module.exports = includedModel;