'use strict';

var _ = require('lodash');
var Q = require('q');

var oauth2 = rootRequire('/app/auth/oauth2/oauth2');

var sqldb = rootRequire('/sqldb');
var User = sqldb.User;
var Movie = sqldb.Movie;
var Episode = sqldb.Episode;
var Season = sqldb.Season;
var Video = sqldb.Video;
var Image = sqldb.Image;
var UsersVideos = sqldb.UsersVideos;

var billingApi = rootRequire('/billing-api');

var utils = require('../utils.js');

var filters = rootRequire('/app/api/filters.js');

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
    });
  }

  User.findAndCountAll(paramsObj)
    .then(utils.responseWithResultAndTotal(res))
    .catch(res.handleError());
};

/**
 * Creates a new user
 */
exports.create = function (req, res) {
  Q()
    .then(function () {
      /*
       * Exception bouygues MIAMI
       */
      if (req.passport.client &&
          req.passport.client.isBouyguesMiami() &&
          req.body.email &&
          req.body.bouyguesId) {
        // Si jamais la box miami essaye de créer un nouvel utilisateur,
        // mais que l'email existe déjà, et est déjà reliée à un bouyguesId
        //   alors on crée un nouvel utilisateur sans email avec le nvx bouyguesId
        return User.find({where:{email:{$iLike: req.body.email}}})
          .then(function (user) {
            // l'utilisateur existe déjà en base avec un bouyguesId différent
            //  on supprime l'email en entrée pour générer un nouvel utilisateur
            //  pour ce bouyguesId sans risquer une erreur sur l'index unique de l'email
            if (user && user.bouyguesId && // user existe en base
                req.body.bouyguesId !== user.bouyguesId) { // bouyguesId différent
              var logger = req.logger.prefix('USERS').prefix('BOUYGUES');
              logger.warn('try create user ' + req.body.email + ' / ' + req.body.bouyguesId);
              logger.warn('but user '+ user._id + ' / ' + user.bouyguesId + ' already exist with this email');
              logger.warn('=> removing email from req.body, to create new user with bouyguesId ' + req.body.bouyguesId);
              req.body.email = null; // va permettre la création
            }
          });
      }
    })
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
    .catch(res.handleError(422));
};

exports.search = function (req, res) {
  Q()
    .then(function () {
      if (!Array.isArray(req.body.facebookIdList)) {
        throw new Error('malformed facebookIdList');
      }
      return User.findAll({
        where: {
          facebook: {
            id: {
              $in: req.body.facebookIdList
            }
          }
        }
      });
    })
    .then(function (users) {
      // FIXME: USER_PRIVACY: we should implement a privacy filter in a single place
      return users.map(function (user) {
        return user.getPublicInfos();
      });
    })
    .then(res.json.bind(res))
    .catch(res.handleError());
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
  // FIXME : use joi.
  var updateableFields = [
    /* 'email', */ // FIXME_023 Please read the comment above before changing this.
    'name',
    'first_name',
    'last_name',
    //
    'telephone',
    'birthDate',
    'gender',
    'nationality',
    //
    'languageId',
    //
    'postalAddressCountry',
    'postalAddressLocality',
    'postalAddressRegion',
    'postalAddressCode',
    'postalAddressCity',
    'postalAddressStreet',
    //
    'jobTitle',
    //
    'playerCaption',
    'playerAudio',
    'playerQuality',
    'playerKoment',
    'playerAutoNext',
    //
    'emailOptIn',
    'emailNewsletter',
    'avatarImageId',
    'socialSharing',
    //
    'webPushNotifications',
    //
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
    .then(function () { res.json(req.user.getInfos()); })
    .catch(res.handleError(422));
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
      return res.json(user.getInfos());
    })
    .catch(function (err) {
      return next(err);
    });
};

exports.history = function (req, res) {
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
    function (err) { res.status(err.statusCode || 500).json({error: String(err)});}
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
exports.auth0ChangePassword = function (req, res) {
  var userMail = req.param('email');
  var newPass = req.param('password');

  User.find({
    where: {
      email: userMail
    }
  })
    .then(function (user) {
      if (!user) {
        throw new Error('user not found');
      }
      user.password = newPass;
      return user.save();
    })
    .then(
      function (user) {
        res.json(user.getInfos());
      },
      res.handleError(422)
    );
};
/**
 * Change a users password
 */
exports.changePassword = function (req, res) {
  var userId = req.user._id;
  var oldPass = String(req.body.oldPassword);
  var newPass = String(req.body.newPassword);

  User.find({
    where: {
      _id: userId
    }
  })
    .then(function (user) {
      if (!user.authenticate(oldPass)) {
        var error = new Error('wrong password');
        error.statusCode = 403;
        throw error;
      }
      user.password = newPass;
      return user.save();
    })
    .then(
      function () { res.status(200).end(); },
      res.handleError(422)
    );
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
      return user.save();
    })
    .then(
      function () { res.status(200).end(); },
      res.handleError(422)
    );
};

/*
 * FIXME: a quoi sert cette fonction ???
 *  avant le refacto, elle ne faisait déjà rien
 *   (user.save() d'un user non modifié)
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
        throw new Error('user not found');
      }
      return user;
    })
    .then(
      function (user) { res.json(user.getInfos()); },
      res.handleError(422)
    );
};

/**
 * User profile +
 *  profile.subscriptionsStatus
 *  profile.planCode
 */
exports.me = function (req, res) {
  var userInfos = req.user.getInfos();

  // on enrichi le profile avec des infos de souscriptions
  billingApi.getSubscriptionsStatus(req.user._id)
    .then(function (subscriptionsStatus) {
      // utilisateur inscrit
      userInfos.subscriptionsStatus = subscriptionsStatus;
      userInfos.planCode = subscriptionsStatus ? subscriptionsStatus.planCode : undefined;
    }, function () {
      // utilisateur inscrit mais non abonné
      req.logger.log('[INFO]: /api/users/me: user registered but no subscriptions (' + req.user._id + ')');
    })
    .then(
    function success() { res.json(userInfos); },
    res.handleError()
  );
};

/**
 * Authentication callback
 */
exports.authCallback = function (req, res) {
  res.redirect('/');
};
