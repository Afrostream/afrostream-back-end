/**
 * Populate DB with sample data on server start
 * to disable, edit config/index.js, and set `seedDB: false`
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
var config = require('./../config/index');
if (config.sequelize.uri.indexOf('amazon') !== -1) {
  console.error('security: the database url seems to contain amazon string, production environment ?');
  console.error('security: cannot seed using production / staging environment');
  console.error('exit 1');
  process.exit(1);
}

var sqldb = require('./index.js');
var Category = sqldb.Category;
var CatchupProvider = sqldb.CatchupProvider;
var Movie = sqldb.Movie;
var Episode = sqldb.Episode;
var Season = sqldb.Season;
var Language = sqldb.Language;
var User = sqldb.User;
var Client = sqldb.Client;
var Video = sqldb.Video;
var Image = sqldb.Image;
var Actor = sqldb.Actor;
var Broadcaster = sqldb.Broadcaster;

var Promise = require('bluebird');
var promises = [];

var nbGeneratedMovies = 50;
var nbGeneratedSeasons = 5;
var nbGeneratedEpisodes = 10;
var getMovieTitle = function (i) { return 'Title of random movie ' + i; };
var getSeasonTitle = function (i) { return 'Title of random season ' + i; };
var getEpisodeTitle = function (i) { return 'Title of random episode ' + i; };
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
  .then(function () {
      return Category.create({
      _id: 3000000,
      label: 'bet',
      slug: 'bet',
      active: true,
      ro: true
    })
  })
);

promises.push(
  CatchupProvider.sync()
  .then(function () {
    return CatchupProvider.destroy({where: {}});
  })
  .then(function () {
    return CatchupProvider.create({
      _id: 1,
      name: 'bet',
      expiration: 1209600,
      categoryId: 3000000
    });
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
        poster: 'http://www.dvdsreleasedates.com/posters/800/B/Beyond-the-Lights-2014-movie-poster.jpg',
        active: (i % 7 === 0)
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
    var seasons = [{
      title: 'In the mood for love Season 1',
      synopsis: 'Integration with popular tools such as Bower, Grunt, Karma, ' +
      'Mocha, JSHint, Node Inspector, Livereload, Protractor, Jade, ' +
      'Stylus, Sass, CoffeeScript, and Less.',
      poster: 'http://www.dvdsreleasedates.com/posters/800/B/Beyond-the-Lights-2014-movie-poster.jpg'
    }];

    for (var i = 0; i < nbGeneratedSeasons; i++) {
      seasons.push({
        title: getSeasonTitle(i),
        synopsis: 'synopsis of random season ' + i,
        active: (i % 3 === 0)
      });
    }
    return Season.bulkCreate(seasons);
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
    var episodes = [{
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
    }];

    for (var i = 0; i < nbGeneratedEpisodes; i++) {
      episodes.push({
        title: getEpisodeTitle(i),
        synopsis: 'synopsis of random episode ' + i,
        active: (i % 3 === 0)
      });
    }

    return  Episode.bulkCreate(episodes);
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
          active: true,
          encodingId: String(Math.round(Math.random()*100000)),
          drm: ((i % 3) ? true: false)
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
      password: '123456'
    }, {
      provider: 'local',
      name: 'Test User',
      email: 'benjamin@afrostream.tv',
      password: '123456'
    }, {
      provider: 'local',
      role: 'admin',
      name: 'Admin',
      email: 'admin@admin.com',
      account_code: '30920ee0-5012-11e5-890e-6119da7f1e67',
      password: '123456'
    }]);
  })
);

promises.push(
  Broadcaster.sync()
  .then(function () {
    return Broadcaster.destroy({where: {}});
  })
  .then(function () {
    return Broadcaster.bulkCreate([{
      _id: "WEB",
      name: "WEB",
      fqdn: "{localhost:9000}",
      defaultCountryId: "FR",
      pfName: "AFROSTREAM"
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
      name: 'afrostream-front',
      _id: '8c261045-89a3-44bb-af38-65a847269605',
      secret: '3dc3cae6-9c79-487a-9e0f-712be857dcee',
      type: 'front-api.front-end',
      role: 'client',
      broadcasterId: 'WEB'
    }, {
      name: 'tapptic',
      _id: '1abf31b2-4242-4242-9fd2-f3a63bda64b4',
      secret: 'ba287044-4242-4242-a6f7-51aed34d4791',
      type: 'legacy-api.tapptic',
      role: 'client'
    }, {
      name: 'roku',
      _id: '84b2041b-4242-4242-9081-f6629f512edf',
      secret: '0533056e-4242-4242-9f09-6c74d5e68a27',
      type: 'legacy-api.roku',
      role: 'client'
    }, {
      name: 'bouygues miami',
      _id: 'cbd89e11-4242-4242-93be-deaade1bd17f',
      secret: '6bb9d594-4242-4242-ab04-d76dda10c76a',
      type: 'legacy-api.bouygues-miami',
      billingProviderName: 'bachat',
      role: 'client'
    }, {
      name: 'afrostream-exports-bouygues',
      _id: '5df3bb18-02a0-4a58-9a4a-4fc5ed5ea7c4',
      secret: '02694a0b-5e67-4f03-8a80-a55329ad9975',
      type: 'afrostream-exports-bouygues',
      role: 'admin'
    }, {
      name: 'afrostream-exports-osearch',
      _id: 'a94343ce-5c4b-46f4-a7ce-480a41f77621',
      secret: '5f6e946a-7140-4877-9c3c-1f3456c00a7a',
      type: 'afrostream-exports-osearch',
      role: 'admin'
    }, {
      name: 'orange',
      _id: '610fa4d5-05ec-4493-b9a6-e50a04f7fdcc',
      secret: "b0eee6d9-8771-4d93-8407-ee67af60408c",
      type: "legacy-api.orange",
      role: "client"
    }, {
      name: 'orange newbox',
      _id: '6789a4d5-05ec-5555-b9a6-e50a04f7fccc',
      secret: "6789a6d9-8771-5555-8407-ee67af604ccc",
      type: "legacy-api.orange-newbox",
      role: "client"
    }, {
      name: 'afrostream-admin',
      _id: '488d2f13-6c01-464f-bfa4-bf8c641d7063',
      secret: "17abaee4-032d-4703-be86-0af3523dcedd",
      type: "afrostream-admin.gui",
      role: "client",
      broadcasterId: "WEB"
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
