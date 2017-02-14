'use strict';

const sqldb = rootRequire('sqldb');
const Video = sqldb.Video;
const Category = sqldb.Category;
const Season = sqldb.Season;
const Image = sqldb.Image;
const Licensor = sqldb.Licensor;
const Actor = sqldb.Actor;

module.exports.get = () => [
  {model: Video, as: 'video', required: false},
  {model: Category, as: 'categorys', required: false},
  {model: Season, as: 'seasons', required: false},
  {model: Image, as: 'logo', required: false},
  {model: Image, as: 'poster', required: false},
  {model: Image, as: 'thumb', required: false},
  {model: Licensor, as: 'licensor', required: false},
  {model: Actor, as: 'actors', required: false}
];

module.exports.getSearch = () => [
  {model: Image, as: 'logo', required: false},
  {model: Image, as: 'thumb', required: false}
];
