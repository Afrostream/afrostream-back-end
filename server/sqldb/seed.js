/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

// security
if (!process.env.SEED_DB) {
  console.error('security: are you sure you want to seed ?');
  console.error('security: if you want to seed, please export SEED_DB=true before launching node or grunt');
  console.error('exit 1');
  process.exit(1);
}
if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging' || process.env.DATABASE_URL) {
  console.error('security: cannot seed using production / staging environment');
  console.error('exit 1');
  process.exit(1);
}
var config = require('./../config/environment/index');
if (config.sequelize.uri.indexOf('amazon') !== -1) {
  console.error('security: the database url seems to contain amazon string, production environment ?');
  console.error('security: cannot seed using production / staging environment');
  console.error('exit 1');
  process.exit(1);
}

var sqldb = require('./index.js');
var Category = sqldb.Category;
var Movie = sqldb.Movie;
var Episode = sqldb.Episode;
var Season = sqldb.Season;
var Language = sqldb.Language;
var User = sqldb.User;
var Client = sqldb.Client;
var Video = sqldb.Video;
var Image = sqldb.Image;
var Actor = sqldb.Actor;

var Promise = require('bluebird');
var promises = [];

var nbGeneratedMovies = 50;
var getMovieTitle = function (i) { return 'Title of random movie ' + i; };
var getVideoName = function (i) { return 'video ' + i; };

console.log('SEEDING DATA IN DATABASE');

promises.push(
  Actor.sync()
    .then(function () {
      return Actor.destroy({where : {}});
    })
    .then(function () {
      return Actor.bulkCreate([{
        firstName: 'Will',
        lastName: 'Smith',
        imdbId: 'nm0000226'
      },{
        firstName: 'Eddie',
        lastName: 'Murphy',
        imdbId: 'nm0000552'
      },{
        firstName: 'Halle',
        lastName: 'Berry',
        imdbId: 'nm0000932'
      }])
    })
);

promises.push(
  Category.sync()
  .then(function () {
    return Category.destroy({where: {}});
  })
  .then(function () {
    return Category.bulkCreate([{
      label: 'Sélection',
      slug: 'selection'
    }, {
      label: 'Nouveauté',
      slug: 'nouveaute'
    }]);
  })
);

promises.push(
  Video.sync()
  .then(function () {
    return Video.destroy({where: {}});
  })
);

promises.push(
  Movie.sync()
  .then(function () {
    return Movie.destroy({where: {}});
  })
  .then(function () {
    var movies = [{
      title: 'In the mood for love',
      synopsis: 'Integration with popular tools such as Bower, Grunt, Karma, ' +
      'Mocha, JSHint, Node Inspector, Livereload, Protractor, Jade, ' +
      'Stylus, Sass, CoffeeScript, and Less.',
      poster: 'http://www.dvdsreleasedates.com/posters/800/B/Beyond-the-Lights-2014-movie-poster.jpg',
      type: 'serie'
    }, {
      title: 'Shauwn the sheep',
      synopsis: 'Built with a powerful and fun stack: MongoDB, Express, ' +
      'AngularJS, and Node.',
      poster: 'http://www.dvdsreleasedates.com/posters/800/B/Beyond-the-Lights-2014-movie-poster.jpg'
    }, {
      title: 'Smart Build System',
      synopsis: 'Build system ignores `spec` files, allowing you to keep ' +
      'tests alongside code. Automatic injection of scripts and ' +
      'styles into your index.html',
      poster: 'http://www.dvdsreleasedates.com/posters/800/B/Beyond-the-Lights-2014-movie-poster.jpg'
    }, {
      title: 'Modular Structure',
      synopsis: 'Best practice client and server structures allow for more ' +
      'code reusability and maximum scalability',
      poster: 'http://www.dvdsreleasedates.com/posters/800/B/Beyond-the-Lights-2014-movie-poster.jpg'
    }, {
      title: 'Optimized Build',
      synopsis: 'Build process packs up your templates as a single JavaScript ' +
      'payload, minifies your scripts/css/images, and rewrites asset ' +
      'names for caching.',
      poster: 'http://www.dvdsreleasedates.com/posters/800/B/Beyond-the-Lights-2014-movie-poster.jpg'
    }, {
      title: 'Deployment Ready',
      synopsis: 'Easily deploy your app to Heroku or Openshift with the heroku ' +
      'and openshift subgenerators',
      poster: 'http://www.dvdsreleasedates.com/posters/800/B/Beyond-the-Lights-2014-movie-poster.jpg'
    }];
    for (var i = 0; i < nbGeneratedMovies; i++) {
      movies.push({
        title: getMovieTitle(i),
        synopsis: 'synopsis of random movie ' + i,
        poster: 'http://www.dvdsreleasedates.com/posters/800/B/Beyond-the-Lights-2014-movie-poster.jpg'
      });
    }
    return Movie.bulkCreate(movies);
  })
);

promises.push(
  Image.sync()
    .then(
    function () {
      return Image.destroy({where: {}})
    })
    .then(function () {
      var images = [
        {
          name: 'my poster for random movie 0',
          type: 'poster',
          path: '/posters/800/B/Beyond-the-Lights-2014-movie-poster.jpg',
          poster: 'http://www.dvdsreleasedates.com/posters/800/B/Beyond-the-Lights-2014-movie-poster.jpg',
          imgix: 'https://afrostream.imgix.net/production/poster/2015/08/fa4bdc4fbce200c1d451-Mann%20and%20wife%202560x1440.jpg',
          mimetype: 'image/jpeg',
          active: true
        },
        {
          name: 'my logo for random movie 0',
          type: 'logo',
          path: '/posters/800/B/Beyond-the-Lights-2014-movie-poster.jpg',
          poster: 'http://www.dvdsreleasedates.com/posters/800/B/Beyond-the-Lights-2014-movie-poster.jpg',
          imgix: 'https://afrostream.imgix.net/production/poster/2015/08/fa4bdc4fbce200c1d451-Mann%20and%20wife%202560x1440.jpg',
          mimetype: 'image/jpeg',
          active: true
        },
        {
          name: 'my thumb for random movie 0',
          type: 'thumb',
          path: '/posters/800/B/Beyond-the-Lights-2014-movie-poster.jpg',
          poster: 'http://www.dvdsreleasedates.com/posters/800/B/Beyond-the-Lights-2014-movie-poster.jpg',
          imgix: 'https://afrostream.imgix.net/production/poster/2015/08/4a30e42a01bae2b25dfd-for%20better%20or%20worse%20670x1000.jpg',
          mimetype: 'image/jpeg',
          active: true
        }

      ];
      return Image.bulkCreate(images);
    })
);

promises.push(
  Season.sync()
  .then(function () {
    return Season.destroy({where: {}});
  })
  .then(function () {
    return Season.bulkCreate([{
      title: 'In the mood for love Season 1',
      synopsis: 'Integration with popular tools such as Bower, Grunt, Karma, ' +
      'Mocha, JSHint, Node Inspector, Livereload, Protractor, Jade, ' +
      'Stylus, Sass, CoffeeScript, and Less.',
      poster: 'http://www.dvdsreleasedates.com/posters/800/B/Beyond-the-Lights-2014-movie-poster.jpg'
    }]);
  })
);

promises.push(Language.sync()
  .then(function () {
    return Language.destroy({where: {}});
  })
  .then(function () {
    return Language.bulkCreate([{
      label: 'Français',
      lang: 'fr'
    }]);
  })
);

promises.push(Episode.sync()
  .then(function () {
    return Episode.destroy({where: {}});
  })
  .then(function () {
    return Episode.bulkCreate([{
      title: 'In the mood for love Episode 1',
      synopsis: 'Integration with popular tools such as Bower, Grunt, Karma, ' +
      'Mocha, JSHint, Node Inspector, Livereload, Protractor, Jade, ' +
      'Stylus, Sass, CoffeeScript, and Less.',
      poster: 'http://www.dvdsreleasedates.com/posters/800/B/Beyond-the-Lights-2014-movie-poster.jpg',
      episodeNumber: 1,
      sort: 1
    }, {
      title: 'In the mood for love Episode 3',
      synopsis: 'Integration with popular tools such as Bower, Grunt, Karma, ' +
      'Mocha, JSHint, Node Inspector, Livereload, Protractor, Jade, ' +
      'Stylus, Sass, CoffeeScript, and Less.',
      poster: 'http://www.dvdsreleasedates.com/posters/800/B/Beyond-the-Lights-2014-movie-poster.jpg',
      episodeNumber: 3,
      sort: 3
    }, {
      title: 'In the mood for love Episode 2',
      synopsis: 'Integration with popular tools such as Bower, Grunt, Karma, ' +
      'Mocha, JSHint, Node Inspector, Livereload, Protractor, Jade, ' +
      'Stylus, Sass, CoffeeScript, and Less.',
      poster: 'http://www.dvdsreleasedates.com/posters/800/B/Beyond-the-Lights-2014-movie-poster.jpg',
      episodeNumber: 2,
      sort: 2
    }, {
      title: 'In the mood for love Episode 6',
      synopsis: 'Integration with popular tools such as Bower, Grunt, Karma, ' +
      'Mocha, JSHint, Node Inspector, Livereload, Protractor, Jade, ' +
      'Stylus, Sass, CoffeeScript, and Less.',
      poster: 'http://www.dvdsreleasedates.com/posters/800/B/Beyond-the-Lights-2014-movie-poster.jpg',
      episodeNumber: 6,
      sort: 6
    }, {
      title: 'In the mood for love Episode 5',
      synopsis: 'Integration with popular tools such as Bower, Grunt, Karma, ' +
      'Mocha, JSHint, Node Inspector, Livereload, Protractor, Jade, ' +
      'Stylus, Sass, CoffeeScript, and Less.',
      poster: 'http://www.dvdsreleasedates.com/posters/800/B/Beyond-the-Lights-2014-movie-poster.jpg',
      episodeNumber: 5,
      sort: 5
    }, {
      title: 'In the mood for love Episode 4',
      synopsis: 'Integration with popular tools such as Bower, Grunt, Karma, ' +
      'Mocha, JSHint, Node Inspector, Livereload, Protractor, Jade, ' +
      'Stylus, Sass, CoffeeScript, and Less.',
      poster: 'http://www.dvdsreleasedates.com/posters/800/B/Beyond-the-Lights-2014-movie-poster.jpg',
      episodeNumber: 4,
      sort: 4
    }
    ]);
  })
);

promises.push(Video.sync()
    .then(function () {
      return Video.destroy({where: {}});
    })
    .then(function () {
      var videos = [];
      for (var i = 0; i < nbGeneratedMovies; i++) {
        videos.push({
          name: getVideoName(i),
          importId: Math.round(Math.random()*1000),
          active: true
        });
      }
      return Video.bulkCreate(videos);
    })
);

promises.push(
  User.sync()
  .then(function () {
    return User.destroy({where: {}});
  })
  .then(function () {
    return User.bulkCreate([{
      provider: 'local',
      name: 'Test User',
      email: 'test@test.com',
      password: 'test'
    }, {
      provider: 'local',
      name: 'Test User',
      email: 'benjamin@afrostream.tv',
      password: 'test'
    }, {
      provider: 'local',
      role: 'admin',
      name: 'Admin',
      email: 'admin@admin.com',
      account_code: '30920ee0-5012-11e5-890e-6119da7f1e67',
      password: 'admin'
    }]);
  })
);

promises.push(
  Client.sync()
  .then(function () {
    return Client.destroy({where: {}});
  })
  .then(function () {
    return Client.bulkCreate([{
      name: 'Test Client',
      _id: '8c261045-89a3-44bb-af38-65a847269605',
      secret: '3dc3cae6-9c79-487a-9e0f-712be857dcee'
    }]);
  })
);

Promise.all(promises).then(function () {
  console.log('All rows created. Creating links.');
  // linking movie <-> video
  Promise.all([
    Promise.all(
      Array.apply(null, Array(nbGeneratedMovies)).map(function (o, i) {
        return Video.findOne({ where: { name: getVideoName(i) }});
      })
    ),
    Promise.all(
      Array.apply(null, Array(nbGeneratedMovies)).map(function (o, i) {
        return Movie.findOne({ where: { title: getMovieTitle(i) }});
      })
    )
  ]).then(function (data) {
      var videos = data[0]
        , movies = data[1];

    return Promise.all(movies.map(function (movie, i) {
      movie.videoId = videos[i]._id;
      return movie.save()
    }));
  });
  // linking random movie 0 <-> images
  Promise.all([
    Movie.findOne({where: { title: getMovieTitle(0)}}),
    Image.findOne({where: { type: 'poster'}}),
    Image.findOne({where: { type: 'logo'}}),
    Image.findOne({where: { type: 'thumb'}})
  ]).spread(function (movie, poster, logo, thumb) {
    movie.posterId = poster._id;
    movie.logoId = logo._id;
    movie.thumbId = thumb._id;
    return movie.save();
  });
  // linking movie <-> season
  Promise.all([
    Movie.findOne({ where: { title: 'In the mood for love' }}),
    Season.findOne({ where: { title: 'In the mood for love Season 1' }})
  ]).spread(function (movie, season) {
    season.movieId = movie._id;
    return season.save();
  });
  // linking season <-> episodes
  Promise.all([
    Season.findOne({ where: { title: 'In the mood for love Season 1' } }),
    Promise.all([
      Episode.findOne({ where: { title: 'In the mood for love Episode 1'} }),
      Episode.findOne({ where: { title: 'In the mood for love Episode 2'} }),
      Episode.findOne({ where: { title: 'In the mood for love Episode 3'} }),
      Episode.findOne({ where: { title: 'In the mood for love Episode 4'} }),
      Episode.findOne({ where: { title: 'In the mood for love Episode 5'} }),
      Episode.findOne({ where: { title: 'In the mood for love Episode 6'} }),
    ])
  ]).then(function (data) {
    var season = data[0]
      , episodes = data[1];

    return Promise.all(
      episodes.map(function (episode) {
        console.log('assigning season._id' + season._id + ' to episode ' + episode.title)
        episode.seasonId = season._id;
        return episode.save();
      })
    );
  });
  // linking Movies <-> Actors
  Promise.all([
    Movie.findOne({where : { title: getMovieTitle(0) }}),
    Actor.findAll({ where: {} })
  ]).then(function (data) {
    var movie = data[0]
      , actors = data[1];

    return movie.addActors(actors).then(function () {
      return movie.save();
    })
  });
});