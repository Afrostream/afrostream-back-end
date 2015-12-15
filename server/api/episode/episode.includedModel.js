'use strict';

var sqldb = require('../../sqldb');
var Season = sqldb.Season;
var Video = sqldb.Video;
var Image = sqldb.Image;

var includedModel = [
  {
    model: Season, as: 'season',
    required: false,
    order: [['sort', 'ASC']]
  },
  {model: Video, as: 'video', required: false},
  {model: Image, as: 'poster', required: false},
  {model: Image, as: 'thumb', required: false}
];

module.exports = includedModel;