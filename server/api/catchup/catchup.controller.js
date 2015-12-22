'use strict';

var url = require('url');

var sqldb = require('../../sqldb');
var Category = sqldb.Category;
var Episode = sqldb.Episode;
var Movie = sqldb.Movie;
var Season = sqldb.Season;
var CatchupProvider = sqldb.CatchupProvider;

var request = require('request');
var rp = require('request-promise');

var Q = require('q');

var config = require('../../config/environment/index');

// convert mamItem to video
var importVideo = require('../mam/mam.import.js').importVideo;

var saveAndParseXml = require('./bet/xml').saveAndParseXml;
var getCatchupProviderInfos = require('./bet/catchupprovider').getInfos;
var saveCaptionsToBucket = require('./bet/aws').saveCaptionsToBucket;

var createMovieSeasonEpisode = function (catchupProviderInfos, infos, video) {
  console.log('catchup: creating movies , seasons, episodes using infos ' + JSON.stringify(infos));
  var episodeTitle = infos.EPISODE_TITLE_FRA || infos.EPISODE_TITLE || infos.ASSET_TITLE;
  var episodeResume = infos.EPISODE_RESUME || '';
  var seriesTitle = infos.SERIES_TITLE_FRA || 'Unknown';
  var seriesResume = infos.SERIES_RESUME || '';

  if (parseInt(infos.EPISODE_NUMBER, 10) || parseInt(infos.SEASON_NUMBER, 10)) {
    var episodeNumber = parseInt(infos.EPISODE_NUMBER, 10) || 1;
    var seasonNumber = parseInt(infos.SEASON_NUMBER, 10) || 1;

    return Q.all([
      Episode.findOrCreate({
        where: { catchupProviderId: catchupProviderInfos._id, episodeNumber: episodeNumber, title: episodeTitle },
        defaults: { synopsis: episodeResume, active: true }
      }),
      Season.findOrCreate({
        where: { catchupProviderId: catchupProviderInfos._id, seasonNumber: seasonNumber, title: seriesTitle },
        defaults: { synopsis: seriesResume, active: true }
      }),
      Movie.findOrCreate({
        where: { catchupProviderId: catchupProviderInfos._id, title: seriesTitle},
        defaults: { synopsis: seriesResume, type: 'serie', active: true }
      })
    ]).spread(function (episodeInfos, seasonInfos, movieInfos) {
      var episode = episodeInfos[0]
        , season = seasonInfos[0]
        , movie = movieInfos[0];

      var dateFrom = new Date()
        , dateTo = new Date(new Date().getTime() + 1000 * catchupProviderInfos.expiration);

      return Q.all([
        episode.update({ dateFrom: dateFrom, dateTo: dateTo }),
        season.update({ dateFrom: dateFrom, dateTo: dateTo }),
        movie.update({ dateFrom: dateFrom, dateTo: dateTo })
      ]);
    }).spread(function (episode, season, movie) {
      console.log('catchup: movie ' + movie._id + ' season ' + season._id + ' episode ' + episode._id);
      // set Video in Episode
      return Q.all([
        episode.setVideo(video),
        episode.setSeason(season),
        season.setMovie(movie)
      ]).then(function () { return movie; })
    });
  } else {
    return Movie.findOrCreate({
      where: { catchupProviderId: catchupProviderInfos._id, title: seriesTitle}, defaults: { synopsis: seriesResume, type: 'movie', active: true }
    }).then(function (movieInfos) {
      var movie = movieInfos[0];
      console.log('catchup: movie ' + movie._id);
      return movie.setVideo(video).then(function () { return movie; });
    })
  }
};

var addMovieToCatchupCategory = function (catchupProviderInfos, movie) {
  if (catchupProviderInfos.categoryId) {
    return Category.findById(catchupProviderInfos.categoryId)
      .then(function (category) {
        if (!category) {
          console.error('catchup: missing category');
        } else {
          // FIXME: order.
          console.log('catchup: attaching movie ' + movie._id + ' to catchup category ' + category._id);
          return category.addMovie(movie);
        }
      });
  }
};

/**
 * INPUT data =
 * {
 *   "sharedSecret": "62b8557f248035275f6f8219fed7e9703d59509c"
 *   "xml": "http://blabla.com/foo/bar/niania",
 *   "mamId": "1316",
 *   "captions": [ "http://file1", "http://file2", ... ]
 * }
 *
 * Workflow :
 *
 *  xml download => xml upload => xml parsing =>
 *  catchup provider read                     =>
 *  captions download => captions upsert      =>
 *                                               video creation => movie/episode/season creation
 *
 */
var bet = function (req, res) {
  Q()
    .then(function validateBody() {
      if (req.body.sharedSecret !== '62b8557f248035275f6f8219fed7e9703d59509c')  throw 'unauthentified';
      if (!req.body.xml) throw 'xml missing';
      if (!req.body.mamId) throw 'mamId missing';
      if (req.body.captions && !Array.isArray(req.body.captions)) throw 'malformed captions';
    })
    .then(function () {
      var catchupProviderId = config.catchup.bet.catchupProviderId;
      var mamId = req.body.mamId
        , xmlUrl = req.body.xml
        , captions = req.body.captions || [];

      // parallel execution of
      return Q.all([
        saveAndParseXml(catchupProviderId, mamId, xmlUrl),
        getCatchupProviderInfos(catchupProviderId),
        saveCaptionsToBucket(catchupProviderId, mamId, captions)
      ]).then(function (result) {
        var xmlInfos = result[0]
          , catchupProviderInfos = result[1]
          , captionsInfos = result[2];

        // upserting
        return rp({uri: config.mam.domain + '/' + mamId, json: true})
          .then(importVideo)
          .then(function (video) {
            // video modifier
            if (!video) {
              throw 'catchup: '+catchupProviderId+': '+mamId+': video import from mam failed';
            }
            console.log('catchup: '+catchupProviderId+': '+mamId+': video._id =' + video._id);
            return video.update({catchupProviderId: catchupProviderInfos._id});
          })
          .then(function (video) {
            // FIXME: in the future, we should add theses captions to the video.
            return createMovieSeasonEpisode(catchupProviderInfos, xmlInfos, video);
          })
          .then(function (movie) {
            return addMovieToCatchupCategory(catchupProviderInfos, movie);
          });
      });
    }).then(
    function success() {res.json({status:'success'}); },
    function error(err) {
      console.error(err);
      res.status(500).json({status:'error',message:String(err)});}
  );
};

module.exports.bet = bet;