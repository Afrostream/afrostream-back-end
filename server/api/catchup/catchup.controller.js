'use strict';

var url = require('url');

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

var aws = require('../../aws.js');

var flatten = function (xml) {
  var result = {};
  var rec = function (xmlNode) {
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
  };
  rec(xml);
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
 * save the xml content into aws s3 bucket 'tracks.afrostream.tv'
 *   in directory  {env}/catchup/xml/{mamId}-{name} where name is the end of xml filename.
 *
 * @param catchupProviderId  number
 * @param mamId              number   mam id
 * @param xmlUrl             string   url containing the xml file
 * @returns {*}              string   xml content
 */
var saveXmlToBucket = function (catchupProviderId, mamId, xmlUrl) {
  return rp(xmlUrl).then(function (xml) {
    var bucket = aws.getBucket('tracks.afrostream.tv');
    var name = url.parse(xmlUrl).pathname.split('/').pop();
    return aws.putBufferIntoBucket(bucket, xml, 'text/xml', '{env}/catchup/xml/' + mamId + '-' + name)
      .then(function (awsInfos) {
        console.log('catchup: '+catchupProviderId+': '+mamId+': xml '+xmlUrl+' was imported to '+awsInfos.req.url);
        return xml;
      });
  });
};

var saveCaptionToBucket = function (catchupProviderId, mamId, captionUrl) {
  return rp(captionUrl).then(function (caption) {
    var bucket = aws.getBucket('tracks.afrostream.tv');
    var name = url.parse(captionUrl).pathname.split('/').pop();
    return aws.putBufferIntoBucket(bucket, caption, 'application/octet-stream', '{env}/catchup/xml/' + mamId + '-' + name)
      .then(function (awsInfos) {
        console.log('catchup: '+catchupProviderId+': '+mamId+': caption '+captionUrl+' was imported to '+awsInfos.req.url);
      });
  });
};

var saveCaptionsToBucket = function (catchupProviderId, mamId, captionsUrls) {
  return Q.all(captionsUrls.map(function (captionUrl) {
    return saveCaptionToBucket(catchupProviderId, mamId, captionUrl);
  }));
};

/**
 * parse & flatten the xml.
 *
 * @param catchupProviderId  number
 * @param mamId              number   mam id
 * @param xml                string   containing the xml.
 * @returns {*}              object   { flatten xml object }
 */
var parseXml = function (catchupProviderId, mamId, xml) {
  console.log('catchup: '+catchupProviderId+': '+mamId+': parsing xml = ', xml);
  return Q.nfcall(xml2js.parseString, xml)
    .then(function (json) {
      console.log('catchup: '+catchupProviderId+': '+mamId+': json =' + JSON.stringify(json));
      var flattenXml = flatten(json);
      console.log('catchup: '+catchupProviderId+': '+mamId+': flatten = ' + JSON.stringify(flattenXml));
      return flattenXml;
    });
};

var saveAndParseXml = function (catchupProviderId, mamId, xmlUrl) {
  return saveXmlToBucket(catchupProviderId, mamId, xmlUrl)
    .then(function (xml) {
      return parseXml(catchupProviderId, mamId, xml);
    });
};

var getCatchupProviderInfos = function (catchupProviderId) {
  return CatchupProvider.find({where: { _id: catchupProviderId } })
    .then(function (catchupProvider) {
      if (catchupProvider) {
        return catchupProvider.dataValues;
      } else {
        return {
          _id: config.catchup.bet.catchupProviderId,
          expiration: config.catchup.bet.defaultExpiration
        }
      }
    });
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
            // FIXME: in the future, we should add theses captions to the video.
            return createMovieSeasonEpisode(catchupProviderInfos, xmlInfos, video);
          })
          .then(addMovieToCatchupCategory);
      });
    }).then(
    function success() {res.json({status:'success'}); },
    function error(err) {
      console.error(err);
      res.status(500).json({status:'error',message:String(err)});}
  );
};

module.exports.bet = bet;