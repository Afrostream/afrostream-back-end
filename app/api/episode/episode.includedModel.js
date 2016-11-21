'use strict';

var sqldb = rootRequire('sqldb');
var Season = sqldb.Season;
var Video = sqldb.Video;
var Image = sqldb.Image;

module.exports.get = () => [
  {
    model: Season, as: 'season',
    required: false,
    order: [['sort', 'ASC']]
  },
  {model: Video, as: 'video', required: false},
  {model: Image, as: 'poster', required: false},
  {model: Image, as: 'thumb', required: false}
];