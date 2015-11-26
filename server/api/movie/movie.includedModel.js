'use strict';

var sqldb = require('../../sqldb');
var Video = sqldb.Video;
var Category = sqldb.Category;
var Season = sqldb.Season;
var Image = sqldb.Image;
var Licensor = sqldb.Licensor;
var Actor = sqldb.Actor;

var includedModel = [
  {model: Video, as: 'video'},
  {model: Category, as: 'categorys'},
  {model: Season, as: 'seasons'},
  {model: Image, as: 'logo'},
  {model: Image, as: 'poster'},
  {model: Image, as: 'thumb'},
  {model: Licensor, as: 'licensor'},
  {model: Actor, as: 'actors'}
];

module.exports = includedModel;