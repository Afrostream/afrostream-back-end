var bluebird = require('bluebird');
var passport = require('passport');
var BouyguesStrategy = require('./passport/');
var billingApi = rootRequire('billing-api.js');

var sqldb = rootRequire('sqldb');
var AccessToken = sqldb.AccessToken;

/**
 * - si personne d’a de bouyguesId , je crée un user from scratch et je lui assigne le bouygueId
 * - si lors du signin je trouve deja queql’un qui a un bouyguesId je fail
 * - si je suis loggué (_id) et que je veux lier mon compte bouygues je trouve deja queql’un qui a un bouyguesId je fail
 * - sinon je link
 **/

exports.setup = function (User, config) {
  passport.use(new BouyguesStrategy({
      clientID: config.bouygues.clientID,
      clientSecret: config.bouygues.clientSecret,
      callbackURL: config.frontEnd.protocol + '://' + config.frontEnd.authority + '/auth/bouygues/callback',
      passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function (req, accessToken, refreshToken, profile, done) {
      var email = profile.emails && profile.emails[0] && profile.emails[0].address;
      var bouyguesUser, state; // closures.

      var logger = req.logger.prefix('AUTH').prefix('BOUYGUES').prefix('PASSPORT');

      bluebird.resolve(42)
        .then(function () {
          // parsing state
          state = JSON.parse(req.query.state ? new Buffer(req.query.state, 'base64').toString('ascii') : '{}');
          // setting signup client type
          req.signupClientType = state.signupClientType || null;
          // logs
          logger.log('state = ' + JSON.stringify(state));
          logger.log('signupClientType = ' + req.signupClientType);
        })
        .then(function () {
          logger.log('search bouygues user in DB using profile id = ' + profile.id);
          // search bouygues corresponding user in database
          return User.find({
            where: {
              $or: [{'bouygues.id': profile.id}, {'bouyguesId': profile.id}]
            }
          });
        })
        .then(function (bu) {
          bouyguesUser = bu || null;

          // logs
          if (bouyguesUser) {
            logger.log('bouyguesUser found:' + bouyguesUser._id);
          } else {
            logger.log('bouyguesUser not found');
          }

          // 3 CAS
          logger.log('status='+state.status);
          switch (state.status) {
            /*
             * LINK
             * On lie un compte bouygues a un utilisateur si
             *  - ce compte n'est pas utilisé
             *  - ou ce compte existe mais déjà utilisé par ce même utilisateur
             */
            case 'link':
              // l'appel à /auth/bouygues/link a généré un state contenant accessToken=...
              // on se sert de cet accessToken récupéré dans /auth/bouygues/callback
              // pour re-authentifier l'utilisateur
              var token = state.accessToken;
              logger.log('link: accessToken='+token);
              if (!token) {
                throw new Error("link: missing accessToken");
              }
              return AccessToken.find({where: {token: token}})
                .then(function (accessToken) {
                  if (!accessToken) {
                    throw new Error("link: cannot find accessToken " + token);
                  }
                  logger.log('link: accessToken found, searching user');
                  // l'access-token existe, on cherche l'utilisateur lié
                  return accessToken.getUser();
                })
                .then(function (user) {
                  if (!user) {
                    throw new Error("link: missing user");
                  }
                  if (bouyguesUser && bouyguesUser._id !== user._id) {
                    throw new Error('link: Your profile is already linked to another user');
                  }
                  logger.log('link: user ' + user._id + ' found, asking the billing');
                  return user;
                });
            /*
             * SIGNIN
             * On logue l'utilisateur, uniquement si il existe en base
             */
            case 'signin':
              if (!bouyguesUser) {
                throw new Error("signin: No user found, please associate your profile after being connected'");
              }
              logger.warn('signin: bouygues user exist (' + bouyguesUser._id + ') => SIGNIN');
              return bouyguesUser;
            /*
             * SIGNUP
             * On regarde si l'utilisateur existe déjà en base, si c'est le cas, on signin
             *  sinon on le crée, pour cela on le recherche avec son email (pour éviter de créer un doublon)
             *
             */
            case 'signup':
              if (bouyguesUser) {
                logger.warn('signup: bouygues user already exist => SIGNIN');
                return bouyguesUser;
              }
              // on le cherche en base, il existe chez nous
              return User.find({
                where: sqldb.sequelize.where(
                  sqldb.sequelize.fn('lower', sqldb.sequelize.col('email')),
                  sqldb.sequelize.fn('lower', email)
                )
              }).then(function (user) {
                if (user) {
                  logger.log('signup: user found using email ' + email + ' => UPDATE => SIGNUP');
                  return user;
                } else {
                  logger.log('signup: user not found using email ' + email + ' => CREATE => SIGNUP');
                  return User.create({
                    name: profile.displayName,
                    email: email,
                    first_name: profile.name.givenName,
                    last_name: profile.name.familyName,
                    role: 'user',
                    provider: 'bouygues'
                  });
                }
              });
            default:
              throw new Error('unknown status ' + state.status);
          }
        })
        //
        // we create the user in the billing-api if he doesn't exist yet
        //
        .then(function (user) {
          logger.log('update billingApi userReferenceUuid=' + user._id);
          logger.log('update billingApi userProviderUuid=' + user.bouyguesId);
          return billingApi.getOrCreateUser({
            providerName: 'bouygues',
            userReferenceUuid: user._id,
            userProviderUuid: profile.id,
            userOpts: {
              email: user.email || '',
              firstName: user.first_name || '',
              lastName: user.last_name || '',
              countryCode: req.query.country || undefined,
              languageCode: req.query.language && String(req.query.language).toLowerCase() || undefined
            }
          }).then(function () { return user; });
        })
        .then(function (user) {
          // mise a jour des infos utilisateur
          // on ne peut faire le lien entre un user et un cpeid que si le billing est ok !
          switch (state.status) {
            case 'link':
            case 'signup':
            logger.log('link|signup: saving cpeid, bouygues, name into user');
              // l'utilisateur de cet accessToken existe,
              // on update les infos de compte
              user.name = user.name || profile.displayName;
              user.bouyguesId = profile.id;
              user.bouygues = profile._json;
              return user.save();
            default:
              return user;
          }
        })
        .then(
          function success(user) { return user; },
          function error(err) {
            logger.error(err.message, err);
            throw err; // forwarding the error.
          }
        )
        .nodeify(done);
    }));
};
