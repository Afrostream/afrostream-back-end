'use strict';

var _ = require('lodash');
var Q = require('q');

var oauth2 = rootRequire('/server/auth/oauth2/oauth2');

var sqldb = rootRequire('/server/sqldb');
var User = sqldb.User;
var Client = sqldb.Client;
var Movie = sqldb.Movie;
var Episode = sqldb.Episode;
var Season = sqldb.Season;
var Video = sqldb.Video;
var Image = sqldb.Image;
var UsersVideos = sqldb.UsersVideos;
var passport = require('passport');
var config = rootRequire('/server/config');

var billingApi = rootRequire('/server/billing-api');

var sha1 = require('sha1');

var mailer = rootRequire('/server/components/mailer');

var utils = require('../utils.js');

var filters = rootRequire('/server/app/api/filters.js');

function validationError(res, statusCode) {
  statusCode = statusCode || 422;
  return function (err) {
    console.error('/api/users/: error: validationError: ', err);
    res.status(statusCode).json({error: String(err)});
  }
}

function respondWith(res, statusCode) {
  statusCode = statusCode || 200;
  return function () {
    res.status(statusCode).end();
  };
}

/**
 * Get list of users
 * restriction: 'admin'
 */
exports.index = function (req, res) {
  var queryName = req.param('query');
  var paramsObj = {
    attributes: [
      '_id',
      'name',
      'email',
      'role',
      'active',
      'provider'
    ]
  };

  // pagination
  utils.mergeReqRange(paramsObj, req);

  if (queryName) {
    paramsObj = _.merge(paramsObj, {
      where: {
        email: {$iLike: '%' + queryName + '%'}
      }
    })
  }

  User.findAndCountAll(paramsObj)
    .then(utils.responseWithResultAndTotal(res))
    .catch(res.handleError());
};

/**
 * Creates a new user
 */
exports.create = function (req, res, next) {
  Q()
    .then(function () {
      var newUser = User.build(req.body);
      newUser.setDataValue('provider', 'local');
      newUser.setDataValue('role', 'user');
      return newUser.save();
    })
    .then(function (user) {
      // everything went ok, we send an oauth2 access token
      return Q.ninvoke(oauth2, "generateToken",
        req.passport.client || null,
        user,
        null, // code
        req.clientIp,
        req.userAgent,
        null
      ).then(function (data) {
          var accessToken = data[0]
            , refreshToken = data[1]
            , info = data[2];

          return {
            token: accessToken, // backward compatibility
            access_token:accessToken,
            refresh_token:refreshToken,
            expires_in:info.expires_in
          };
        });
    })
    .then(res.json.bind(res))
    .catch(validationError(res));
};

/**
 * Update a user
 *   currently, only used for bouygues
 *
 **********************************************
 * FIXME_023
 * /!\ l'objet User côté backoffice ne reflète que les infos utilisateurs, pas les infos de billing
 *     ex: quand on paye et que l'on change d'addresse, les infos de l'ancien paiement s'affiche avec l'ancienne adresse
 *         le first_name, name, last_name, email doivent se comporter de la même façon.
 *
 *     les infos Users.{name,first_name,last_name,email} doivent etre décorellées des infos de billing
 *     permettre la mise a jour de ces infos ici, par une GUI front,
 *     doit être implémentée en parallèle avec la création d'une api de mise a jour
 *     de ces informations côté billing.
 ***********************************************
 */
exports.update = function (req, res) {
  //
  var updateableFields = [
    /* 'name', 'first_name', 'last_name', 'email', */ // FIXME_023 Please read the comment above before changing this.
    'bouyguesId',
    'splashList',
    'nickname'
  ];
  updateableFields.forEach(function (field) {
    if (typeof req.body[field] !== 'undefined') {
      req.user[field] = req.body[field];
    }
  });
  // FIXME: security: we should ensure bouyguesId could only be updated by bouygues client.
  req.user.save()
    .then(function () { res.json(req.user.profile); })
    .catch(validationError(res));
};

/**
 * Get a single user
 */
exports.show = function (req, res, next) {
  var userId = req.params.id;

  User.find({
    where: {
      _id: userId
    }
  })
    .then(function (user) {
      if (!user) {
        return res.status(404).end();
      }
      return res.json(user.profile);
    })
    .catch(function (err) {
      return next(err);
    });
};

exports.history = function (req, res, next) {
  var queryOptions = {
    where: { userId: req.user._id },
    order: [ ['dateLastRead', 'desc'] ],
    include: [{
      model: Video,
      as: 'video',
      include: [
        {
          model: Movie,
          as: 'movie',
          include: [
            {model: Image, as: 'logo', required: false, attributes: ['_id', 'name', 'imgix', 'path']},
            {model: Image, as: 'poster', required: false, attributes: ['_id', 'name', 'imgix', 'path', 'profiles']},
            {model: Image, as: 'thumb', required: false, attributes: ['_id', 'name', 'imgix', 'path']}
          ],
          required: false
        },
        {
          model: Episode,
          as: 'episode',
          include: [
            {model: Image, as: 'poster', required: false, attributes: ['_id', 'name', 'imgix', 'path', 'profiles']},
            {model: Image, as: 'thumb', required: false, attributes: ['_id', 'name', 'imgix', 'path']},
            {
              model: Season, as: 'season',
              required: false,
              order: [['sort', 'ASC']]
            }
          ],
          required: false
        }
      ]
    }],
    limit: 10
  };
  //
  queryOptions = filters.filterQueryOptions(req, queryOptions, UsersVideos);
  //
  UsersVideos.findAll(queryOptions)
  .then(
    function (usersVideos) {
      return usersVideos
        // convert sequelize result to plain object
        .map(function (userVideo) {
          return userVideo.toJSON();
        })
        // exclude malformed objects
        .filter(function (userVideo) {
          return userVideo.video && (userVideo.video.episode || userVideo.video.movie);
        })
        // extract video
        .map(function (userVideo) {
          return userVideo.video;
        })
        // return movie or episode
        .map(function (video) {
          if (video.episode) {
            return video.episode;
          } else {
            return video.movie;
          }
        });
    })
  .then(
    function (moviesEpisodes) { res.json(moviesEpisodes); },
    function (err) { res.status(err.statusCode || 500).json({error: String(err)})}
  );
};

/**
 * Deletes a user
 * restriction: 'admin'
 */
exports.destroy = function (req, res) {
  User.destroy({where: {_id: req.params.id}})
    .then(function () {
      res.status(204).end();
    })
    .catch(res.handleError());
};
/**
 * Change a users password
 */
exports.auth0ChangePassword = function (req, res, next) {
  var userMail = req.param('email');
  var newPass = req.param('password');

  User.find({
    where: {
      email: userMail
    }
  })
    .then(function (user) {
      if (!user) {
        return res.status(422).end();
      }
      user.password = newPass;
      return user.save()
        .then(function () {
          res.json(user.profile);
        })
        .catch(validationError(res));
    })
    .catch(function (err) {
      return validationError(err);
    });
};
/**
 * Change a users password
 */
exports.changePassword = function (req, res, next) {
  var userId = req.user._id;
  var oldPass = String(req.body.oldPassword);
  var newPass = String(req.body.newPassword);

  User.find({
    where: {
      _id: userId
    }
  })
    .then(function (user) {
      if (user.authenticate(oldPass)) {
        user.password = newPass;
        return user.save()
          .then(function () {
            res.status(200).end();
          })
          .catch(validationError(res));
      } else {
        return res.status(403).end();
      }
    });
};

/**
 * Change a users role
 */
exports.changeRole = function (req, res) {
  var userId = req.user._id;
  var role = String(req.body.role);

  User.find({
    where: {
      _id: userId
    }
  })
    .then(function (user) {
      user.role = role;
      return user.save()
        .then(function () {
          res.status(200).end();
        })
        .catch(validationError(res));
    });
};
/**
 * Change a users role
 */
exports.verify = function (req, res) {

  var userMail = req.param('email');
  User.find({
    where: {
      email: userMail
    }
  })
    .then(function (user) {
      if (!user) {
        return res.status(422).end();
      }
      user.active = true;
      return user.save()
        .then(function () {
          res.json(user.profile);
        })
        .catch(validationError(res));
    })
    .catch(function (err) {
      return validationError(err);
    });
};

/**
 * User profile +
 *  profile.subscriptionsStatus
 *  profile.planCode
 */
exports.me = function (req, res) {
  var profile = req.user.profile;
  // on enrichi le profile avec des infos de souscriptions
  billingApi.getSubscriptionsStatus(req.user._id)
    .then(function (subscriptionsStatus) {
      // utilisateur inscrit
      profile.subscriptionsStatus = subscriptionsStatus;
      profile.planCode = subscriptionsStatus ? subscriptionsStatus.planCode : undefined;
    }, function () {
      // utilisateur inscrit mais non abonné
      console.log('[INFO]: /api/users/me: user registered but no subscriptions (' + req.user._id + ')');
    })
    .then(
    function success() { res.json(profile); },
    function error(err) {
      console.error('[ERROR]: /api/users/me: ' + err, err);
      res.status(err.statusCode || 500).json({error:String(err)});
    }
  );
};

/**
 * Authentication callback
 */
exports.authCallback = function (req, res, next) {
  res.redirect('/');
};
