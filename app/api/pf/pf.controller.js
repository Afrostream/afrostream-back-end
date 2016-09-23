'use strict';

var _ = require('lodash');
var sqldb = rootRequire('/sqldb');
var Video = sqldb.Video;

var pf = rootRequire('/pf');
var Q = require('q');

function sortPfContents(a, b) {
  // initialized first, followed by ready
  if (a.state === 'initialized' && b.state !== 'initialized') {
    return -1;
  }
  if (a.state === 'initialized' && b.state === 'initialized') {
    if (a.filename === b.filename) {
      return 0
    }
    if (a.filename < b.filename) {
      return -1;
    }
    return 1;
  }
  if (a.filename === b.filename) {
    return 0;
  }
  if (a.filename < b.filename) {
    return -1;
  }
  return 1;
}

module.exports.contents = function (req, res) {
  Q.all([
    pf.getContents(),
    Video.findAll({
      attributes: ["_id", "name", "duration", "encodingId"],
      order: [ [ "name" , "ASC" ] ]
    })
  ]).then(function (data) {
    var pfContents = data[0];
    var videos = data[1];

    // sorting pfContents
    pfContents.sort(sortPfContents);

    var encodingIdToPfContent = pfContents.reduce(function (p, c) { p[c.uuid] = c; return p; }, {});
    var pfContentsEncodingIdList = pfContents.map(function (c) { return c.uuid; });
    var videosEncodingIdList = videos.map(function (v) { return v.encodingId; });
    var missingVideosEncodingIdList = _.difference(pfContentsEncodingIdList, videosEncodingIdList);

    //
    var result = pfContents.filter(function (c) { return missingVideosEncodingIdList.indexOf(c.uuid) !== -1; })
      .map(function (c) {
      return { pfContent: c, video: null };
    })
      .concat(videos.map(function (video) {
      return { pfContent: encodingIdToPfContent[encodingId] || null, video: video };
    }))
    return result;
  }).then(
    function (result) {
      res.json(result);
    },
  function (err) {
    console.error('[ERROR]: [API]: [PF]: '+err.message, err.stack);
    res.status(500).json({error: err.message})
  });
};
