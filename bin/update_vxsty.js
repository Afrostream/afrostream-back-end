// usage: npm run update_vxsty

// staging
process.env.NODE_ENV='staging';
process.env.DATABASE_URL = 'postgres://u4fp4ad34q8qvi:pt7eht3e9v3lnehhh27m7sfeol@ec2-54-228-194-210.eu-west-1.compute.amazonaws.com:5522/d71on7act83b7i';

global.__basedir = __dirname + '/../..';
global.rootRequire = function (name) { return require(global.__basedir + '/' + (name[0] === '/' ? name.substr(1) : name)); };

var config = require('../config');

// on se logue en tant qu'admin
var request = require('request');
var Q = require('q');
var _ = require('lodash');

//
var sqldb = require('../sqldb');
var Movie = sqldb.Movie;

/*
var url = config.backEnd.publicProtocol + '://' + config.backEnd.publicAuthority;

var getAccessToken = function () {
  if (getAccessToken.token) {
    return Q(getAccessToken.token);
  }
  return Q.nfcall(
    request,
    {
      method: 'POST',
      url: url + '/auth/local',
      body : {
        email: 'tech@afrostream.tv',
        password: 'afrostream77'
      }
    }
  )
    .then(function (data) {
      getAccessToken.token = data[1].token;
      return getAccessToken.token;
    });
};

var requestBackEnd = function (requestOptions) {
  return getAccessToken()
    .then(function (token) {
      return Q.nfcall(
        request,
        _.merge({ headers: { Authorization: 'Bearer ' + token } }, requestOptions)
      );
    });
};
*/

//
// Pyramid of doom.
//

// on passe par le call http, pour ne pas avoir a recoder
Movie.findAll()
  .then(function (movies) {
    // toutes les movies
    return movies.reduce(function (p, movie, i) {
      // pour chaque movie, on serialise
      return p.then(function () {
        if (i > 3) {
          // skip
          console.log(movie._id+':skip');
          return;
        }
        return movie.getVideo().then(function (video) {
          // traitement pour 1 unique movie
          if (!video) {
            console.log(movie._id+':no video');
          } else {
            return video.computeVXstY()
              .then(function (vXstY) {
                return movie.update({'vXstY': vXstY}).then(
                  function () {
                    console.log(movie._id+':'+vXstY);
                  }
                );
              });
          }
          // fin traitement 1 unique movie
        })
          .then(function () {
          // nothing
        }, function (err) {
          console.log(movie._id+':ERROR:'+err.message);
        });

      });
      // fin traitement seralisé d'1 movie
    }, Q());
    // fin toutes les movies
  });

