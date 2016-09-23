'use strict';

var url = require('url');

var sqldb = rootRequire('/sqldb');
var Category = sqldb.Category;
var Episode = sqldb.Episode;
var Movie = sqldb.Movie;
var Season = sqldb.Season;
var Language = sqldb.Language;
var Caption = sqldb.Caption;
var Licensor = sqldb.Licensor;
var Video = sqldb.Video;
var CatchupProvider = sqldb.CatchupProvider;

var request = require('request');
var rp = require('request-promise');

var Q = require('q');

var config = rootRequire('/config');

// convert mamItem to video
var importVideo = require('../mam/mam.import.js').importVideo;

var saveAndParseXml = require('./bet/xml').saveAndParseXml;
var getCatchupProviderInfos = require('./bet/catchupprovider').getInfos;
var saveCaptionsToBucket = require('./bet/aws').saveCaptionsToBucket;

var createJobPackCaptions = require('../job/job.packcaptions.js').create;

var slugify = require('slugify');

var createMovieSeasonEpisode = function (catchupProviderInfos, infos, video) {
  console.log('catchup: creating movies , seasons, episodes using infos ' + JSON.stringify(infos));
  var episodeTitle = infos.EPISODE_TITLE_FRA || infos.EPISODE_TITLE || infos.ASSET_TITLE;
  var episodeSlug = slugify(episodeTitle);
  var episodeResume = infos.EPISODE_RESUME || '';
  var seriesTitle = infos.SERIES_TITLE_FRA || episodeTitle || 'Unknown';
  var seriesResume = infos.SERIES_RESUME || episodeResume;
  var seriesSlug = slugify(seriesTitle);

  var txShedDate = infos.TX_SCHED_DATE_PARSED || new Date();
  var dateFrom = new Date(txShedDate.getTime() + 24 * 3600 * 1000) // day + 1.
    , dateTo = new Date(txShedDate.getTime() + 24 * 3600 * 1000 + 1000 * catchupProviderInfos.expiration);

  if (parseInt(infos.EPISODE_NUMBER, 10) && parseInt(infos.SEASON_NUMBER, 10)) {
    var episodeNumber = parseInt(infos.EPISODE_NUMBER, 10) || 1;
    var seasonNumber = parseInt(infos.SEASON_NUMBER, 10) || 1;

    return Q.all([
      Episode.findOrCreate({
        where: { catchupProviderId: catchupProviderInfos._id, episodeNumber: episodeNumber, title: episodeTitle },
        defaults: { synopsis: episodeResume, sort: episodeNumber, dateFrom: dateFrom, active: true }
      }),
      Season.findOrCreate({
        where: { catchupProviderId: catchupProviderInfos._id, seasonNumber: seasonNumber, title: seriesTitle },
        defaults: { synopsis: seriesResume, sort: seasonNumber, dateFrom: dateFrom, active: true }
      }),
      Movie.findOrCreate({
        where: { catchupProviderId: catchupProviderInfos._id, title: seriesTitle},
        defaults: { synopsis: seriesResume, dateFrom: dateFrom, active: true, genre: 'BET' } // FIXME: should not be hardcoded...
      })
    ]).spread(function (episodeInfos, seasonInfos, movieInfos) {
      var episode = episodeInfos[0]
        , season = seasonInfos[0]
        , movie = movieInfos[0];

      return Q.all([
        episode.update({  slug: episodeSlug, dateTo: dateTo, dateFrom: dateFrom }), // dateFrom of episode is "simple"
        season.update({ slug: seriesSlug, dateTo: dateTo }),
        movie.update({ slug: seriesSlug, type: 'serie', dateTo: dateTo })
      ]).then(function (data) {
        console.log('[INFO]: [CATCHUP]: begin smart dateFrom');
        // try to update "smart" date from for season & movie.
        var season = data[1];
        var movie = data[2];

        //
        // searching for the first episode, with dateFrom > now - 8 days (7days + 1 day to be sure)
        // if 1 episode found, assign the episode dateFrom to the season & movie.
        // it's not a perfect algorithm... but it should work.
        //
        var oneWeekAgo = new Date(new Date().getTime() - 1000 * 3600 * 24 * 8);
        return Episode.findAll({
          attributes: ['_id', 'dateFrom'],
          where: { seasonId: season._id, $and: [ { dateFrom: { $gt: oneWeekAgo} }, { dateFrom: { $ne: null } } ] },
          order: [ [ 'dateFrom' , 'ASC' ]],
          limit: 1
        })
        .then(function (episodes) {
          if (episodes && episodes.length && episodes[0]) {
            var nextEpisode = episodes[0];
            console.log('[INFO]: [CATCHUP]: SMART DATE FROM : season(' + season._id + ').dateFrom = ' + nextEpisode.dateFrom);
            return season.update({ dateFrom: nextEpisode.dateFrom });
          }
        })
        .then(function () {
          // same thing for the movie object, we search all the seasons with dateFrom > now - 8 days
          //  and assign the first one to movie
          return Season.findAll({
            attributes: ['dateFrom'],
            where: { movieId: movie._id, $and: [ { dateFrom: { $gt: oneWeekAgo} }, { dateFrom: { $ne: null } } ] },
            order: [ [ 'dateFrom', 'ASC' ]],
            limit: 1
          })
        })
        .then(function (seasons) {
          if (seasons && seasons.length && seasons[0]) {
            var nextSeason = seasons[0];
            console.log('[INFO]: [CATCHUP]: SMART DATE FROM : movie(' + movie._id + ').dateFrom = ' + nextSeason.dateFrom);
            return movie.update({ dateFrom: nextSeason.dateFrom });
          }
        })
        .then(function () {
          return data;
        }, function (err) {
          console.error('[ERROR]: [CATCHUP]: error setting dateFrom ' + err.message)
          return data;
        });
      })
    }).spread(function (episode, season, movie) {
      console.log('catchup: database: movie ' + movie._id + ' season ' + season._id + ' episode ' + episode._id + ' video ' + video._id + ' ' +
                  'episode '+episodeNumber+' [' + episodeTitle + '] season '+seasonNumber+' [' + seriesTitle + '] #content');
      // set Video in Episode
      return Q.all([
        episode.setVideo(video),
        episode.setSeason(season),
        season.setMovie(movie)
      ]).then(function () { return movie; })
    });
  } else {
    return Movie.findOrCreate({
      where: { catchupProviderId: catchupProviderInfos._id, title: seriesTitle},
      defaults: { synopsis: seriesResume, active: true, genre: 'BET' }
    }).then(function (movieInfos) {
      var movie = movieInfos[0];
      console.log('catchup: database: movie ' + movie._id + ' video ' + video._id + ' ' +
                  'movie [' + seriesTitle + '] #content');
      return movie.update({ slug: seriesSlug, type: 'movie', dateFrom: dateFrom, dateTo: dateTo });
    }).then(function (movie) {
      return movie.setVideo(video).then(function () { return movie; });
    });
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
      })
      .then(function () { return movie; });
  }
};

var linkMovieToLicensor = function (catchupProviderInfos, movie) {
  if (catchupProviderInfos.licensorId) {
    return Licensor.findById(catchupProviderInfos.licensorId)
      .then(function (licensor) {
        if (!licensor) {
          console.error('catchup: missing licensor');
        } else {
          // FIXME: order.
          console.log('catchup: attaching movie ' + movie._id + ' to licensor ' + licensor._id);
          return movie.update({licensorId: licensor._id});
        }
      })
      .then(function () { return movie; });
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
 *  FIXME: needs a big refactoring.
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
            // attach captions to video: 2 steps:
            //  - find or create caption objects
            //  - attach them to the video
            //  - launch automaticaly afrostream-job
            return Q.all(captionsInfos.map(function (captionUrl) {
              // https://s3-eu-west-1.amazonaws.com/tracks.afrostream.tv/production/caption/2015/11/58da212180a508494f47-vimeocom140051722.en.vtt
              console.log('catchup: '+catchupProviderId+': '+mamId+': searching caption ' + captionUrl);
              return Caption.findOrCreate({where: {src: captionUrl, videoId: video._id}})
                .then(function (captionInfos) {
                  var caption = captionInfos[0];
                  console.log('catchup: '+catchupProviderId+': '+mamId+': attaching caption ' + captionUrl + ' id='+ caption._id + ' to video ' + video._id);
                  var matches = captionUrl.match(/\.([^.]+)\.vtt/);
                  var lang = (matches && matches.length > 1) ? matches[1].toLowerCase() : '??';

                  console.log('catchup: '+catchupProviderId+': '+mamId+': caption ' + captionUrl + ' lang='+lang);
                  return Language.findOne({where: { lang: lang } })
                    .then(function (language) {
                      if (language) {
                        console.log('catchup: ' + catchupProviderId + ': ' + mamId + ': caption ' + captionUrl + ' has langId ' + language._id);
                        return language;
                      } else {
                        console.log('catchup: '+catchupProviderId+': '+mamId+': caption ' + captionUrl + ' no langId found, searching "fr"');
                        return Language.findOne({where: { lang: "fr" } });
                      }
                    }).then(function (language) {
                      var langId = language ? language._id : 1;
                      return caption.update({langId: langId });  // langue par defaut: 1 <=> FR. (h4rdc0d3d).
                    });
                });
            })).then(function (captions) {
              // attach captions to the video
              return Q.all(captions.map(function (caption) { return caption.update({videoId: video._id}); }))
            }).then(function () {
              // create the job pack-captions.
              return createJobPackCaptions(video._id);
            }).then(function () {
              return video;
            })
          })
          .then(function (video) {
            // FIXME: in the future, we should add theses captions to the video.
            return createMovieSeasonEpisode(catchupProviderInfos, xmlInfos, video);
          })
          .then(function (movie) {
            return addMovieToCatchupCategory(catchupProviderInfos, movie);
          })
          .then(function (movie) {
            return linkMovieToLicensor(catchupProviderInfos, movie);
          });
      });
    }).then(
    function success() {res.json({status:'success'}); },
    function error(err) {
      console.error('catchup error: ', err);
      res.status(500).json({status:'error',message:String(err)});}
  );
};


var betMovies = function (req, res, next) {
  var catchupProviderId = config.catchup.bet.catchupProviderId;

  var getIncludedModel = require('../movie/movie.includedModel.js').get;

  Movie.findAll({
    where: {catchupProviderId: catchupProviderId},
    include: getIncludedModel(),
    order: [ [ 'dateFrom', 'desc' ] ]
  })
    .then(function (movies) {
      res.json(movies);
    })
    .catch(function (err) {
      console.error('error: ', err);
      res.status(500).send('');
    });
};

var betSeasons = function (req, res, next) {
  var catchupProviderId = config.catchup.bet.catchupProviderId;

  var getIncludedModel = require('../season/season.includedModel.js').get;

  Season.findAll({
    where: {catchupProviderId: catchupProviderId},
    include: getIncludedModel(),
    order: [ [ 'dateFrom', 'desc' ] ]
  })
    .then(function (seasons) {
      res.json(seasons);
    })
    .catch(function (err) {
      console.error('error: ', err);
      res.status(500).send('');
    });
};

var betEpisodes = function (req, res, next) {
  var catchupProviderId = config.catchup.bet.catchupProviderId;

  var getIncludedModel = require('../episode/episode.includedModel.js').get;

  Episode.findAll({
    where: {catchupProviderId: catchupProviderId},
    include: getIncludedModel(),
    order: [ [ 'dateFrom', 'desc' ] ]
  })
    .then(function (episodes) {
      res.json(episodes);
    })
    .catch(function (err) {
      console.error('error: ', err);
      res.status(500).send('');
    });
};

var betVideos = function (req, res, next) {
  var catchupProviderId = config.catchup.bet.catchupProviderId;

  Video.findAll({
    where: {catchupProviderId: catchupProviderId},
    order: [ [ 'name', 'asc' ] ]
  })
    .then(function (videos) {
      res.json(videos);
    })
    .catch(function (err) {
      console.error('error: ', err);
      res.status(500).send('');
    });
};

module.exports.bet = bet;
module.exports.betMovies = betMovies;
module.exports.betSeasons = betSeasons;
module.exports.betEpisodes = betEpisodes;
module.exports.betVideos = betVideos;
