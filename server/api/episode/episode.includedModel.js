'use strict';

var sqldb = require('../../sqldb');
var Season = sqldb.Season;
var Video = sqldb.Video;
var Image = sqldb.Image;

var includedModel = [
  {
    model: Season, as: 'season',
    order: [['sort', 'ASC']]
  },
  {model: Video, as: 'video'},
  {model: Image, as: 'poster'},
  {model: Image, as: 'thumb'}
];

module.exports = includedModel;