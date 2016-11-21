'use strict';

const sqldb = rootRequire('sqldb');
const Season = sqldb.Season;
const Video = sqldb.Video;
const Image = sqldb.Image;

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