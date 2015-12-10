'use strict';

var sqldb = require('../../sqldb');
var Episode = sqldb.Episode;
var Movie = sqldb.Movie;
var Season = sqldb.Season;
var CatchupProvider = sqldb.CatchupProvider;

var request = require('request');
var rp = require('request-promise');
var Q = require('q');

var xml2js = require('xml2js');

var config = require('../../config/environment/index');

// convert mamItem to video
var importVideo = require('../mam/mam.import.js').importVideo;

var flatten = function (xml) {
  var result = {};
  (function rec(xmlNode) {
    Object.keys(xmlNode).forEach(function (key) {
      var val = xmlNode[key];
      switch (key) {
        case 'ASSET_CODE':
        case 'ASSET_TITLE':
        case 'EPISODE_TITLE_FRA':
        case 'SERIES_TITLE_FRA':
        case 'SEASON_NUMBER':
        case 'SERIES_RESUME':
        case 'EPISODE_NUMBER':
        case 'EPISODE_RESUME':
          if (Array.isArray(val) && val.length > 0) {
            result[key] = val[0];
          } else {
            result[key] = null;
          }
          break;
        default:
          if (val && typeof val === 'object')
            rec(val);
          break;
      }
    });
  })(xml);
  return result;
};

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
        where: { catchupProviderId: catchupProviderInfos._id, episodeNumber: episodeNumber, title: episodeTitle }, defaults: { synopsis: episodeResume, active: true }
      }),
      Season.findOrCreate({
        where: { catchupProviderId: catchupProviderInfos._id, seasonNumber: seasonNumber, title: seriesTitle }, defaults: { synopsis: seriesResume, active: true }
      }),
      Movie.findOrCreate({
        where: { catchupProviderId: catchupProviderInfos._id, title: seriesTitle},
        defaults: {
          synopsis: seriesResume,
          type: 'serie',
          dateFrom: new Date(),
          dateTo: new Date(new Date().getTime() + 1000 * catchupProviderInfos.expiration),
          active: true
        }
      })
    ]).spread(function (episodeInfos, seasonInfos, movieInfos) {
      var episode = episodeInfos[0]
        , season = seasonInfos[0]
        , movie = movieInfos[0];
      //
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

var addMovieToCatchupCategory = function (movie) {
  // searching providerId's category
  movie.getCatchupProvider().then(function (catchupProvider) {
    if (!catchupProvider) {
      return; // nothing to do => no category.
    }
    return catchupProvider.getCategory();
  }).then(function (category) {
    if (!category) {
      return; // nothing to do => no category.
    }
    // FIXME: order.
    return category.addMovie(movie);
  });

  // FIXME
  return movie;
};

/**
 * INPUT data =
 * {
 *   "sharedSecret": "62b8557f248035275f6f8219fed7e9703d59509c"
 *   "xml": "http://blabla.com/foo/bar/niania",
 *   "mamId": "1316"
 * }
 */
var bet = function (req, res) {
  // hardcoded...
  if (req.body.sharedSecret !== '62b8557f248035275f6f8219fed7e9703d59509c') {
    return res.status(500).send('unauthentified');
  }
  if (!req.body.xml) {
    return res.status(500).send('xml missing');
  }
  if (!req.body.mamId) {
    return res.status(500).send('mamId missing');
  }
  Q.nfcall(request, {
    method: 'GET',
    uri: req.body.xml
  }).spread(function (response, body) {
    console.log('catchup: bet: xml=', body);
    return Q.nfcall(xml2js.parseString, body);
  }).then(function (jsonxml) {
    console.log('catchup: bet: jsonxml=', JSON.stringify(jsonxml));
    return flatten(jsonxml);
  }).then(function (infos) {
    console.log('catchup: bet: infos=', infos);
    // searching catchup provider
    return CatchupProvider.find({where: { _id: config.catchup.bet.id } })
      .then(function (catchupProvider) {
        // computing catchupProvider infos.
        var catchupProviderInfos;

        if (catchupProvider) {
          catchupProviderInfos = catchupProvider.dataValues;
        } else {
          catchupProviderInfos = {
            _id: config.catchup.bet.catchupProviderId,
            expiration: config.catchup.bet.defaultExpiration
          }
        }
        // upserting
        return rp({uri: config.mam.domain + '/' + req.body.mamId, json: true})
          .then(importVideo)
          .then(function (video) {
            return createMovieSeasonEpisode(catchupProviderInfos, infos, video);
          })
          .then(addMovieToCatchupCategory);
      });
  }).then(
    function () { res.json({status:'success'}); },
    function (err) {
      console.error(err);
      res.json({status:'error',message:String(err)});}
  );
};

module.exports.bet = bet;