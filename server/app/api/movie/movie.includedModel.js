'use strict';

var sqldb = rootRequire('/server/sqldb');
var Video = sqldb.Video;
var Category = sqldb.Category;
var Season = sqldb.Season;
var Image = sqldb.Image;
var Licensor = sqldb.Licensor;
var Actor = sqldb.Actor;

module.exports.get = function () {
  return [
    {model: Video, as: 'video', required: false},
    {model: Category, as: 'categorys', required: false},
    {model: Season, as: 'seasons', required: false},
    {model: Image, as: 'logo', required: false},
    {model: Image, as: 'poster', required: false},
    {model: Image, as: 'thumb', required: false},
    {model: Licensor, as: 'licensor', required: false},
    {model: Actor, as: 'actors', required: false}
  ];
};