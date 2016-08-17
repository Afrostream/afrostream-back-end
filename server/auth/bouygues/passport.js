var bluebird = require('bluebird');
var passport = require('passport');
var BouyguesStrategy = require('./passport/');
var billingApi = rootRequire('/server/billing-api.js');

var sqldb = rootRequire('/server/sqldb');
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

      bluebird.resolve(42)
        .then(function () {
          // parsing state
          state = JSON.parse(req.query.state ? new Buffer(req.query.state, 'base64').toString('ascii') : '{}');
          // setting signup client type
          req.signupClientType = state.signupClientType || null;
          // logs
          console.log('[INFO]: [AUTH]: [BOUYGUES]: passport: state = ' + JSON.stringify(state));
          console.log('[INFO]: [AUTH]: [BOUYGUES]: passport: signupClientType = ' + req.signupClientType);
        })
        .then(function () {
          console.log('[INFO]: [AUTH]: [BOUYGUES]: passport: search bouygues user in DB using profile id = ' + profile.id);
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
            console.log('[INFO]: [AUTH]: [BOUYGUES]: passport: bouyguesUser found:' + bouyguesUser._id);
          } else {
            console.log('[INFO]: [AUTH]: [BOUYGUES]: passport: bouyguesUser not found');
          }

          // 3 CAS
          console.log('[INFO]: [AUTH]: [BOUYGUES]: passport: status='+state.status);
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
              console.log('[INFO]: [AUTH]: [BOUYGUES]: passport: link: accessToken='+token);
              if (!token) {
                throw new Error("link: missing accessToken");
              }
              return AccessToken.find({where: {token: token}})
                .then(function (accessToken) {
                  if (!accessToken) {
                    throw new Error("link: cannot find accessToken " + token);
                  }
                  console.log('[INFO]: [AUTH]: [BOUYGUES]: passport: link: accessToken found, searching user');
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
                  console.log('[INFO]: [AUTH]: [BOUYGUES]: passport: link: user ' + user._id + ' found, asking the billing');
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
              console.log('[WARNING]: [AUTH]: [BOUYGUES]: passport: signin: bouygues user exist (' + bouyguesUser._id + ') => SIGNIN');
              return bouyguesUser;
            /*
             * SIGNUP
             * On regarde si l'utilisateur existe déjà en base, si c'est le cas, on signin
             *  sinon on le crée, pour cela on le recherche avec son email (pour éviter de créer un doublon)
             *
             */
            case 'signup':
              if (bouyguesUser) {
                console.log('[WARNING]: [AUTH]: [BOUYGUES]: passport: signup: bouygues user already exist => SIGNIN');
                return bouyguesUser;
              }
              // on le cherche en base, il existe chez nous
              return User.find({
                where: {
                  'email': {$iLike: email}
                }
              }).then(function (user) {
                if (user) {
                  console.log('[INFO]: [AUTH]: [BOUYGUES]: passport: signup: user found using email ' + email + ' => UPDATE => SIGNUP');
                  return user;
                } else {
                  console.log('[INFO]: [AUTH]: [BOUYGUES]: passport: signup: user not found using email ' + email + ' => CREATE => SIGNUP');
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
          console.log('[INFO]: [AUTH]: [BOUYGUES]: update billingApi userReferenceUuid=' + user._id);
          console.log('[INFO]: [AUTH]: [BOUYGUES]: update billingApi userProviderUuid=' + user.bouyguesId);
          return billingApi.getOrCreateUser({
            providerName: 'bouygues',
            userReferenceUuid: user._id,
            userProviderUuid: profile.id,
            userOpts: {
              email: user.email || '',
              firstName: user.first_name || '',
              lastName: user.last_name || ''
            }
          }).then(function () { return user; });
        })
        .then(function (user) {
          // mise a jour des infos utilisateur
          // on ne peut faire le lien entre un user et un cpeid que si le billing est ok !
          switch (state.status) {
            case 'link':
            case 'signup':
            console.log('[INFO]: [AUTH]: [BOUYGUES]: link|signup: saving cpeid, bouygues, name into user');
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
            console.error('[ERROR]: [AUTH]: [BOUYGUES]: passport: '+err.message, err);
            throw err; // forwarding the error.
          }
        )
        .nodeify(done);
    }));
};
