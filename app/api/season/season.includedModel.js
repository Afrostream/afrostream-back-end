'use strict';

const sqldb = rootRequire('sqldb');
const Episode = sqldb.Episode;
const Movie = sqldb.Movie;
const Image = sqldb.Image;

module.exports.get = () => [
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