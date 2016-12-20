'use strict';

const _ = require('lodash');
const Q = require('q');

const oauth2 = rootRequire('app/auth/oauth2/oauth2');

const sqldb = rootRequire('sqldb');
const User = sqldb.User;
const Movie = sqldb.Movie;
const Episode = sqldb.Episode;
const Season = sqldb.Season;
const Video = sqldb.Video;
const Image = sqldb.Image;
const UsersVideos = sqldb.UsersVideos;

const billingApi = rootRequire('billing-api');

const utils = require('../utils.js');

const filters = rootRequire('app/api/filters.js');

const statsd = rootRequire('statsd');

/**
 * Get list of users
 * restriction: 'admin'
 */
exports.index = (req, res) => {
  const queryName = req.param('query');
  let paramsObj = {
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
    .then(utils.responseWithResultAndTotal(req, res))
    .catch(res.handleError());
};

/**
 * Creates a new user
 */
exports.create = (req, res) => {
  Q()
    .then(() => {
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
          .then(user => {
            // l'utilisateur existe déjà en base avec un bouyguesId différent
            //  on supprime l'email en entrée pour générer un nouvel utilisateur
            //  pour ce bouyguesId sans risquer une erreur sur l'index unique de l'email
            if (user && user.bouyguesId && // user existe en base
                req.body.bouyguesId !== user.bouyguesId) { // bouyguesId différent
              const logger = req.logger.prefix('USERS').prefix('BOUYGUES');
              logger.warn('try create user ' + req.body.email + ' / ' + req.body.bouyguesId);
              logger.warn('but user '+ user._id + ' / ' + user.bouyguesId + ' already exist with this email');
              logger.warn('=> removing email from req.body, to create new user with bouyguesId ' + req.body.bouyguesId);
              req.body.email = null; // va permettre la création
            }
          });
      }
    })
    .then(() => {
      const newUser = User.build(req.body);
      newUser.setDataValue('provider', 'local');
      newUser.setDataValue('role', 'user');
      return newUser.save();
    })
    .then(user => {
      statsd.client.increment('api.users.create');
      // everything went ok, we send an oauth2 access token
      return Q.ninvoke(oauth2, "generateToken", {
        client: req.passport.client || null,
        user: user,
        code: null,
        userIp: req.clientIp,
        userAgent: req.userAgent,
        expireIn: null,
        req: req,
        res: res
      }).then(data => {
        const accessToken = data[0], refreshToken = data[1], info = data[2];

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

exports.search = (req, res) => {
  Q()
    .then(() => {
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
    .then(users => // FIXME: USER_PRIVACY: we should implement a privacy filter in a single place
  users.map(user => user.getPublicInfos()))
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
exports.update = (req, res) => {
  // FIXME : use joi.
  const updateableFields = [
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
  updateableFields.forEach(field => {
    if (typeof req.body[field] !== 'undefined') {
      req.user[field] = req.body[field];
    }
  });
  // FIXME: security: we should ensure bouyguesId could only be updated by bouygues client.
  req.user.save()
    .then(() => { res.json(req.user.getInfos()); })
    .catch(res.handleError(422));
};

/**
 * Get a single user
 */
exports.show = (req, res, next) => {
  const userId = req.params.id;

  User.find({
    where: {
      _id: userId
    }
  })
    .then(user => {
      if (!user) {
        return res.status(404).end();
      }
      return res.json(user.getInfos());
    })
    .catch(err => next(err));
};

exports.history = (req, res) => {
  let queryOptions = {
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
    limit: 30
  };

  if (req.query.limit) {
    queryOptions = _.merge(queryOptions, {
      limit: req.query.limit
    });
  }
  //
  queryOptions = filters.filterQueryOptions(req, queryOptions, UsersVideos);
  //
  UsersVideos.findAll(queryOptions)
  .then(
    usersVideos => usersVideos
      // convert sequelize result to plain object
      .map(userVideo => userVideo.toJSON())
      // exclude malformed objects
      .filter(userVideo => userVideo.video && (userVideo.video.episode || userVideo.video.movie))
      // extract video
      .map(userVideo => userVideo.video)
      // return movie or episode
      .map(video => {
        if (video.episode) {
          return video.episode;
        } else {
          return video.movie;
        }
      }))
  .then(
    moviesEpisodes => { res.json(moviesEpisodes); },
    err => { res.status(err.statusCode || 500).json({error: String(err)});}
  );
};

/**
 * Deletes a user
 * restriction: 'admin'
 */
exports.destroy = (req, res) => {
  User.destroy({where: {_id: req.params.id}})
    .then(() => {
      res.status(204).end();
    })
    .catch(res.handleError());
};
/**
 * Change a users password
 */
exports.auth0ChangePassword = (req, res) => {
  const userMail = req.param('email');
  const newPass = req.param('password');

  User.find({
    where: {
      email: userMail
    }
  })
    .then(user => {
      if (!user) {
        throw new Error('user not found');
      }
      user.password = newPass;
      return user.save();
    })
    .then(
      user => {
        res.json(user.getInfos());
      },
      res.handleError(422)
    );
};
/**
 * Change a users password
 */
exports.changePassword = (req, res) => {
  const userId = req.user._id;
  const oldPass = String(req.body.oldPassword);
  const newPass = String(req.body.newPassword);

  User.find({
    where: {
      _id: userId
    }
  })
    .then(user => {
      if (!user.authenticate(oldPass)) {
        const error = new Error('wrong password');
        error.statusCode = 403;
        throw error;
      }
      user.password = newPass;
      return user.save();
    })
    .then(
      () => { res.status(200).end(); },
      res.handleError(422)
    );
};

/**
 * Change a users role
 */
exports.changeRole = (req, res) => {
  const userId = req.user._id;
  const role = String(req.body.role);

  User.find({
    where: {
      _id: userId
    }
  })
    .then(user => {
      user.role = role;
      return user.save();
    })
    .then(
      () => { res.status(200).end(); },
      res.handleError(422)
    );
};

/*
 * FIXME: a quoi sert cette fonction ???
 *  avant le refacto, elle ne faisait déjà rien
 *   (user.save() d'un user non modifié)
 */
exports.verify = (req, res) => {
  const userMail = req.param('email');
  User.find({
    where: {
      email: userMail
    }
  })
    .then(user => {
      if (!user) {
        throw new Error('user not found');
      }
      return user;
    })
    .then(
      user => { res.json(user.getInfos()); },
      res.handleError(422)
    );
};

/**
 * User profile +
 *  profile.subscriptionsStatus
 *  profile.planCode
 */
exports.me = (req, res) => {
  const userInfos = req.user.getInfos();

  // on enrichi le profile avec des infos de souscriptions
  billingApi.getSubscriptionsStatus(req.user._id)
    .then(subscriptionsStatus => {
      // utilisateur inscrit
      userInfos.subscriptionsStatus = subscriptionsStatus;
      userInfos.planCode = subscriptionsStatus ? subscriptionsStatus.planCode : undefined;
    }, () => {
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
exports.authCallback = (req, res) => {
  res.redirect('/');
};
