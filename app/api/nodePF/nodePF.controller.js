const sqldb = rootRequire('sqldb');

const pf = rootRequire('pf');
const NodePF = rootRequire('nodePF');

const Q = require('q');

function findPfMd5HashOfMoviesByTitle(title) {
  return sqldb.Movie.findAll({
    where : {
      active: true,
      title : { $iLike : `%${title}%` },
      type: 'movie'
    },
    include: {
      as: 'video',
      model: sqldb.Video,
      required: true
    }
  }).then(movies => {
    return movies.map(movie => {
      return movie.video.pfMd5Hash;
    });
  });
}

function findPfMd5HashOfEpisodesByTitle(title) {
  return sqldb.Episode.findAll({
    where : {
      active: true,
      title : { $iLike : `%${title}%` }
    },
    include: {
      as: 'video',
      model: sqldb.Video,
      required: true
    }
  }).then(episodes => {
    return episodes.map(episode => {
      return episode.video.pfMd5Hash;
    });
  });
}

/*
 * exports content with metadata.
 */
module.exports.index = (req, res) => {
  const limit = req.query.limit || 5;

  Q()
    .then(() => {
      if (req.query.title) {
        return Q.all([
          findPfMd5HashOfMoviesByTitle(req.query.title),
          findPfMd5HashOfEpisodesByTitle(req.query.title)
        ]).then(([moviesPfMd5Hash, episodesPfMd5Hash]) => {
          return [].concat(moviesPfMd5Hash, episodesPfMd5Hash);
        });
      }
      if (req.query.videoId) {
        return sqldb.Video.find({
          where: {_id: req.query.videoId}
        })
          .then(video => video.pfMd5Hash);
      }
      if (req.query.episodeId) {
        return sqldb.Episode.find({
          where: {_id: req.query.episodeId},
          include: {
            as: 'video',
            model: sqldb.Video,
            required: true
          }
        })
          .then(episode => episode.video.pfMd5Hash);
      }
      if (req.query.movieId) {
        return sqldb.Movie.find({
          where: {_id: req.query.movieId},
          include: {
            as: 'video',
            model: sqldb.Video,
            required: true
          }
        })
          .then(movie => movie.video.pfMd5Hash);
      }
      if (req.query.pfMd5Hash) {
        return [ req.query.pfMd5Hash ];
      }
    })
    .then(pfMd5HashList => {
      const list = pfMd5HashList.filter((v, i, a) => a.indexOf(v) === i) // unique
        .filter((v, i) => i < limit); // on limit a 5 content max.

      // convert to results
      return Q.all(
        list.map(pfMd5Hash => new pf.PfContent(pfMd5Hash).getContent())
      );
    })
    .then(contentList => {
      // convert content => contentID
      const contentIdList = [];

      if (req.query.contentId) {
        contentIdList.push(req.query.contentId);
      }
      contentList.forEach(content => contentIdList.push(content.contentId));
      return contentIdList;
    })
    .then(contentIdList => {
      // on restreint a 5 elements uniques.
      return contentIdList.filter((v, i, a) => a.indexOf(v) === i) // uniques
        .filter((v, i) => i < limit);
    })
    .then(contentIdList => {
      // query new API.
      const nodePF = new NodePF();
      return Q.all(
        contentIdList.map(contentId => nodePF.getPfContentById(contentId))
      );
    })
    .then(contents => {
      res.json(contents);
    })
    .catch(res.handleError());
};
