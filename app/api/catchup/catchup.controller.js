'use strict';

var sqldb = rootRequire('sqldb');
var Category = sqldb.Category;
var Episode = sqldb.Episode;
var Movie = sqldb.Movie;
var Season = sqldb.Season;
var Language = sqldb.Language;
var Caption = sqldb.Caption;
var Licensor = sqldb.Licensor;
var Video = sqldb.Video;

var Q = require('q');

var config = rootRequire('config');

var pf = rootRequire('pf');

// convert mamItem to video
var createVideoFromPfContent = require('../video/video.controller.js').createFromPfContent;

var saveAndParseXml = require('./bet/xml').saveAndParseXml;
var getCatchupProviderInfos = require('./bet/catchupprovider').getInfos;
var saveCaptionsToBucket = require('./bet/aws').saveCaptionsToBucket;

var createJobPackCaptions = require('../job/job.packcaptions.js').create;

var slugify = require('slugify');

var logger = rootRequire('logger').prefix('CATCHUP');

var createMovieSeasonEpisode = (catchupProviderInfos, infos, video) => {
  logger.log('creating movies , seasons, episodes using infos ' + JSON.stringify(infos));
  var episodeTitle = infos.EPISODE_TITLE_FRA || infos.EPISODE_TITLE || infos.ASSET_TITLE;
  var episodeSlug = slugify(episodeTitle);
  var episodeResume = infos.EPISODE_RESUME || '';
  var seriesTitle = infos.SERIES_TITLE_FRA || episodeTitle || 'Unknown';
  var seriesResume = infos.SERIES_RESUME || episodeResume;
  var seriesSlug = slugify(seriesTitle);

  var txShedDate = infos.TX_SCHED_DATE_PARSED || new Date();
  var dateFrom = new Date(txShedDate.getTime() + 24 * 3600 * 1000) // day + 1.
    , dateTo = new Date(txShedDate.getTime() + 24 * 3600 * 1000 + 1000 * catchupProviderInfos.expiration);

  if (!Number.isNaN(parseInt(infos.EPISODE_NUMBER, 10)) && !Number.isNaN(parseInt(infos.SEASON_NUMBER, 10))) {
    var episodeNumber = parseInt(infos.EPISODE_NUMBER, 10) || 1;
    var seasonNumber = parseInt(infos.SEASON_NUMBER, 10) || 1;

    return Q.all([
      sqldb.nonAtomicFindOrCreate(Episode, {
        where: { catchupProviderId: catchupProviderInfos._id, episodeNumber: episodeNumber, title: episodeTitle },
        defaults: { synopsis: episodeResume, sort: episodeNumber, dateFrom: dateFrom, active: true }
      }),
      sqldb.nonAtomicFindOrCreate(Season, {
        where: { catchupProviderId: catchupProviderInfos._id, seasonNumber: seasonNumber, title: seriesTitle },
        defaults: { synopsis: seriesResume, sort: seasonNumber, dateFrom: dateFrom, active: true }
      }),
      sqldb.nonAtomicFindOrCreate(Movie, {
        where: { catchupProviderId: catchupProviderInfos._id, title: seriesTitle},
        defaults: { synopsis: seriesResume, dateFrom: dateFrom, active: true, genre: 'BET' } // FIXME: should not be hardcoded...
      })
    ]).spread((episodeInfos, seasonInfos, movieInfos) => {
      var episode = episodeInfos[0]
        , season = seasonInfos[0]
        , movie = movieInfos[0];

      return Q.all([
        episode.update({  slug: episodeSlug, dateTo: dateTo, dateFrom: dateFrom }), // dateFrom of episode is "simple"
        season.update({ slug: seriesSlug, dateTo: dateTo }),
        movie.update({ slug: seriesSlug, type: 'serie', dateTo: dateTo })
      ]).then(data => {
        logger.log('begin smart dateFrom');
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
        .then(episodes => {
          if (episodes && episodes.length && episodes[0]) {
            var nextEpisode = episodes[0];
            logger.log('SMART DATE FROM : season(' + season._id + ').dateFrom = ' + nextEpisode.dateFrom);
            return season.update({ dateFrom: nextEpisode.dateFrom });
          }
        })
        .then(() => // same thing for the movie object, we search all the seasons with dateFrom > now - 8 days
        //  and assign the first one to movie
        Season.findAll({
          attributes: ['dateFrom'],
          where: { movieId: movie._id, $and: [ { dateFrom: { $gt: oneWeekAgo} }, { dateFrom: { $ne: null } } ] },
          order: [ [ 'dateFrom', 'ASC' ]],
          limit: 1
        }))
        .then(seasons => {
          if (seasons && seasons.length && seasons[0]) {
            var nextSeason = seasons[0];
            logger.log('SMART DATE FROM : movie(' + movie._id + ').dateFrom = ' + nextSeason.dateFrom);
            return movie.update({ dateFrom: nextSeason.dateFrom });
          }
        })
        .then(() => data, err => {
          logger.error('error setting dateFrom ' + err.message);
          return data;
        });
      });
    }).spread((episode, season, movie) => {
      logger.log('database: movie ' + movie._id + ' season ' + season._id + ' episode ' + episode._id + ' video ' + video._id + ' ' +
                  'episode '+episodeNumber+' [' + episodeTitle + '] season '+seasonNumber+' [' + seriesTitle + '] #content');
      // set Video in Episode
      return Q.all([
        episode.setVideo(video),
        episode.setSeason(season),
        season.setMovie(movie)
      ])
      .then(() => movie);
    });
  } else {
    return sqldb.nonAtomicFindOrCreate(Movie, {
      where: { catchupProviderId: catchupProviderInfos._id, title: seriesTitle},
      defaults: { synopsis: seriesResume, active: true, genre: 'BET' }
    }).then(movieInfos => {
      var movie = movieInfos[0];
      logger.log('database: movie ' + movie._id + ' video ' + video._id + ' ' +
                  'movie [' + seriesTitle + '] #content');
      return movie.update({ slug: seriesSlug, type: 'movie', dateFrom: dateFrom, dateTo: dateTo });
    }).then(movie => movie.setVideo(video).then(() => movie));
  }
};

var addMovieToCatchupCategory = (catchupProviderInfos, movie) => {
  if (catchupProviderInfos.categoryId) {
    return Category.findById(catchupProviderInfos.categoryId)
      .then(category => {
        if (!category) {
          logger.error('missing category');
        } else {
          // FIXME: order.
          logger.log('attaching movie ' + movie._id + ' to catchup category ' + category._id);
          return category.addMovie(movie);
        }
      })
      .then(() => movie);
  }
};

var linkMovieToLicensor = (catchupProviderInfos, movie) => {
  if (catchupProviderInfos.licensorId) {
    return Licensor.findById(catchupProviderInfos.licensorId)
      .then(licensor => {
        if (!licensor) {
          logger.error('missing licensor');
        } else {
          // FIXME: order.
          logger.log('attaching movie ' + movie._id + ' to licensor ' + licensor._id);
          return movie.update({licensorId: licensor._id});
        }
      })
      .then(() => movie);
  }
};

/**
 * INPUT data =
 * {
 *   "sharedSecret": "62b8557f248035275f6f8219fed7e9703d59509c"
 *   "xml": "http://blabla.com/foo/bar/niania",
 *   "pfContentId": "1316",
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
var bet = (req, res) => {
  Q()
    .then(function validateBody() {
      if (req.body.sharedSecret !== '62b8557f248035275f6f8219fed7e9703d59509c')  throw 'unauthentified';
      if (!req.body.xml) throw 'xml missing';
      if (!req.body.pfContentId) throw 'pfContentId missing';
      if (req.body.captions && !Array.isArray(req.body.captions)) throw 'malformed captions';
    })
    .then(() => {
      var catchupProviderId = config.catchup.bet.catchupProviderId;
      var pfContentId = req.body.pfContentId
        , xmlUrl = req.body.xml
        , captions = req.body.captions || [];

      // parallel execution of
      return Q.all([
        saveAndParseXml(catchupProviderId, pfContentId, xmlUrl),
        getCatchupProviderInfos(catchupProviderId),
        saveCaptionsToBucket(catchupProviderId, pfContentId, captions)
      ]).then(result => {
        var xmlInfos = result[0]
          , catchupProviderInfos = result[1]
          , captionsInfos = result[2];

        // upserting
        var pfContent = new (pf.PfContent)();
        return pfContent.getContentById(pfContentId)
          .then(createVideoFromPfContent)
          .then(video => {
            // video modifier
            if (!video) {
              throw 'catchup: '+catchupProviderId+': '+pfContentId+': video import from mam failed';
            }
            logger.log(catchupProviderId+': '+pfContentId+': video._id =' + video._id);
            return video.update({catchupProviderId: catchupProviderInfos._id});
          })
          .then(video => // attach captions to video: 2 steps:
        //  - find or create caption objects
        //  - attach them to the video
        //  - launch automaticaly afrostream-job
        Q.all(captionsInfos.map(captionUrl => {
          // https://s3-eu-west-1.amazonaws.com/tracks.afrostream.tv/production/caption/2015/11/58da212180a508494f47-vimeocom140051722.en.vtt
          logger.log(catchupProviderId+': '+pfContentId+': searching caption ' + captionUrl);
          return sqldb.nonAtomicFindOrCreate(Caption, {where: {src: captionUrl, videoId: video._id}})
            .then(captionInfos => {
              var caption = captionInfos[0];
              logger.log(catchupProviderId+': '+pfContentId+': attaching caption ' + captionUrl + ' id='+ caption._id + ' to video ' + video._id);
              var matches = captionUrl.match(/\.([^.]+)\.vtt/);
              var lang = (matches && matches.length > 1) ? matches[1].toLowerCase() : '??';

              logger.log(catchupProviderId+': '+pfContentId+': caption ' + captionUrl + ' lang='+lang);
              return Language.findOne({where: { lang: lang } })
                .then(language => {
                  if (language) {
                    logger.log(catchupProviderId + ': ' + pfContentId + ': caption ' + captionUrl + ' has langId ' + language._id);
                    return language;
                  } else {
                    logger.log(catchupProviderId+': '+pfContentId+': caption ' + captionUrl + ' no langId found, searching "fr"');
                    return Language.findOne({where: { lang: "fr" } });
                  }
                }).then(language => {
                  var langId = language ? language._id : 1;
                  return caption.update({langId: langId });  // langue par defaut: 1 <=> FR. (h4rdc0d3d).
                });
            });
        })).then(captions => // attach captions to the video
        Q.all(captions.map(caption => caption.update({videoId: video._id})))).then(() => // create the job pack-captions.
        createJobPackCaptions(video._id)).then(() => video))
          .then(video => // FIXME: in the future, we should add theses captions to the video.
        createMovieSeasonEpisode(catchupProviderInfos, xmlInfos, video))
          .then(movie => addMovieToCatchupCategory(catchupProviderInfos, movie))
          .then(movie => linkMovieToLicensor(catchupProviderInfos, movie));
      });
    }).then(
    function success() {res.json({status:'success'}); },
    res.handleError()
  );
};


var betMovies = (req, res) => {
  var catchupProviderId = config.catchup.bet.catchupProviderId;

  var getIncludedModel = require('../movie/movie.includedModel.js').get;

  Movie.findAll({
    where: {catchupProviderId: catchupProviderId},
    include: getIncludedModel(),
    order: [ [ 'dateFrom', 'desc' ] ]
  })
  .then(
    res.json.bind(res),
    res.handleError()
  );
};

var betSeasons = (req, res) => {
  var catchupProviderId = config.catchup.bet.catchupProviderId;

  var getIncludedModel = require('../season/season.includedModel.js').get;

  Season.findAll({
    where: {catchupProviderId: catchupProviderId},
    include: getIncludedModel(),
    order: [ [ 'dateFrom', 'desc' ] ]
  })
  .then(
    res.json.bind(res),
    res.handleError()
  );
};

var betEpisodes = (req, res) => {
  var catchupProviderId = config.catchup.bet.catchupProviderId;

  var getIncludedModel = require('../episode/episode.includedModel.js').get;

  Episode.findAll({
    where: {catchupProviderId: catchupProviderId},
    include: getIncludedModel(),
    order: [ [ 'dateFrom', 'desc' ] ]
  })
  .then(
    res.json.bind(res),
    res.handleError()
  );
};

var betVideos = (req, res) => {
  var catchupProviderId = config.catchup.bet.catchupProviderId;

  Video.findAll({
    where: {catchupProviderId: catchupProviderId},
    order: [ [ 'name', 'asc' ] ]
  })
  .then(
    res.json.bind(res),
    res.handleError()
  );
};

module.exports.bet = bet;
module.exports.betMovies = betMovies;
module.exports.betSeasons = betSeasons;
module.exports.betEpisodes = betEpisodes;
module.exports.betVideos = betVideos;
