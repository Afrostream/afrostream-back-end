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

Category.sync()
  .then(function () {
    return Category.destroy({where: {}});
  })
  .then(function () {
    Category.bulkCreate([{
      label: 'Sélection',
      slug: 'selection'
    }, {
      label: 'Nouveauté',
      slug: 'nouveaute'
    }]);
  });

Video.sync()
  .then(function () {
    return Video.destroy({where: {}});
  })
  .then(function () {

  });

Movie.sync()
  .then(function () {
    return Movie.destroy({where: {}});
  })
  .then(function () {
    Movie.bulkCreate([{
      title: 'In the mood for love',
      synopsis: 'Integration with popular tools such as Bower, Grunt, Karma, ' +
      'Mocha, JSHint, Node Inspector, Livereload, Protractor, Jade, ' +
      'Stylus, Sass, CoffeeScript, and Less.',
      poster: 'http://www.dvdsreleasedates.com/posters/800/B/Beyond-the-Lights-2014-movie-poster.jpg'
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
  });

Season.sync()
  .then(function () {
    return Season.destroy({where: {}});
  })
  .then(function () {
    Season.bulkCreate([{
      title: 'In the mood for love Season 1',
      synopsis: 'Integration with popular tools such as Bower, Grunt, Karma, ' +
      'Mocha, JSHint, Node Inspector, Livereload, Protractor, Jade, ' +
      'Stylus, Sass, CoffeeScript, and Less.',
      poster: 'http://www.dvdsreleasedates.com/posters/800/B/Beyond-the-Lights-2014-movie-poster.jpg'
    }]);
  });

Language.sync()
  .then(function () {
    return Language.destroy({where: {}});
  })
  .then(function () {
    Language.bulkCreate([{
      label: 'Français',
      lang: 'fr'
    }]);
  });

Episode.sync()
  .then(function () {
    return Episode.destroy({where: {}});
  })
  .then(function () {
    Episode.bulkCreate([{
      title: 'In the mood for love Episode 1',
      synopsis: 'Integration with popular tools such as Bower, Grunt, Karma, ' +
      'Mocha, JSHint, Node Inspector, Livereload, Protractor, Jade, ' +
      'Stylus, Sass, CoffeeScript, and Less.',
      poster: 'http://www.dvdsreleasedates.com/posters/800/B/Beyond-the-Lights-2014-movie-poster.jpg'
    }]);
  });

User.sync()
  .then(function () {
    return User.destroy({where: {}});
  })
  .then(function () {
    User.bulkCreate([{
      provider: 'local',
      name: 'Test User',
      email: 'test@test.com',
      password: 'test'
    }, {
      provider: 'local',
      role: 'admin',
      name: 'Admin',
      email: 'admin@admin.com',
      account_code: '30dd86878de478338a9e99404aa536fc',
      password: 'admin'
    }])
      .then(function () {
        console.log('finished populating users');
      });
  });

Client.sync()
  .then(function () {
    return Client.destroy({where: {}});
  })
  .then(function () {
    Client.bulkCreate([{
      name: 'Test Client',
      _id: '8c261045-89a3-44bb-af38-65a847269605',
      secret: '3dc3cae6-9c79-487a-9e0f-712be857dcee'
    }])
      .then(function () {
        console.log('finished populating users');
      });
  });
