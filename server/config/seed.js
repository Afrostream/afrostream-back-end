/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

var sqldb = require('../sqldb');
var Category = sqldb.Category;
var Movie = sqldb.Movie;
var Episode = sqldb.Episode;
var Season = sqldb.Season;
var Language = sqldb.Language;
var User = sqldb.User;
var Client = sqldb.Client;
var Video = sqldb.Video;

var Promise = require('bluebird');
var promises = [];

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
    return Movie.bulkCreate([{
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
    }]);
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
});
