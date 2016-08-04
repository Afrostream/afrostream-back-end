var bluebird = require('bluebird');
var passport = require('passport');
var OrangeStrategy = require('./passport/');
var billingApi = rootRequire('/server/billing-api.js');

/**
 * - si personne d’a de ise2 , je crée un user from scratch et je lui assigne le ise2
 * - si lors du signin je trouve deja queql’un qui a un ise2 je fail
 * - si je suis loggué (_id) et que je veux lier mon compte orange je trouve deja queql’un qui a un ise2 je fail
 * - sinon je link
 **/


exports.setup = function (User, config) {
  passport.use(new OrangeStrategy({
      clientID: config.orange.clientID,
      clientSecret: config.orange.clientSecret,
      callbackURL: config.frontEnd.protocol + '://' + config.frontEnd.authority + '/auth/orange/callback',
      passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function (req, orange, done) {
      console.log('[INFO]: [AUTH]: [ORANGE]: orange ', orange);

      var orangeUser, state;

      bluebird.resolve(42)
        .then(function () {
          // parsing state
          state = JSON.parse(req.body.RelayState ? new Buffer(req.body.RelayState || '', 'base64').toString('ascii') : '{}');
          // setting signup client type
          req.signupClientType = state.signupClientType || null;
          // logs
          console.log('[INFO]: [AUTH]: [ORANGE]: passport: state = ' + JSON.stringify(state));
          console.log('[INFO]: [AUTH]: [ORANGE]: passport: signupClientType = ' + req.signupClientType);
        })
        .then(function () {
          console.log('[INFO]: [AUTH]: [ORANGE]: passport: search orange user in DB using profile id = ' + profile.id);
          // search orange corresponding user in database
          return User.find({
            where: {
              $or: [{'orange.identity.collectiveidentifier': orange.identity.collectiveidentifier}, {'ise2': orange.identity.collectiveidentifier}]
            }
          });
        })
        .then(function (ou) {
          orangeUser = ou || null;

          // logs
          if (orangeUser) {
            console.log('[INFO]: [AUTH]: [ORANGE]: passport: orangeUser found: ' + orangeUser._id);
          } else {
            console.log('[INFO]: [AUTH]: [ORANGE]: passport: orangeUser not found');
          }

          // 3 cas
          switch (state.status) {
            /*
             * LINK
             * On lie un compte orange a un utilisateur si
             *  - ce compte n'est pas utilisé
             *  - ou ce compte existe mais déjà utilisé par ce même utilisateur
             */
            case 'link':
              if (!req.user) {
                throw new Error("link: missing req.user");
              }
              if (req.user._id !== state.userId) {
                throw new Error("link: req.user._id !== state.userId " + req.user._id + " " + state.userId);
              }
              if (orangeUser && orangeUser._id !== req.user._id) {
                throw new Error('link: Your profile is already linked to another user');
              }
              // on update les infos de compte
              req.user.ise2 = orange.identity.collectiveidentifier;
              req.user.orange = orange;
              return req.user.save();
              /*
               * SIGNIN
               * On logue l'utilisateur, uniquement si il existe en base
               */
              case 'signin':
                if (!orangeUser) {
                  throw new Error("signin: No user found, please associate your profile after being connected'");
                }
                console.log('[WARNING]: [AUTH]: [ORANGE]: passport: signin: orange user exist => SIGNIN');
                return orangeUser;
                /*
                 * SIGNUP
                 * On regarde si l'utilisateur existe déjà en base, si c'est le cas, on signin
                 *  sinon on le crée, pour cela on le recherche avec son email (pour éviter de créer un doublon)
                 *
                 */
                case 'signup':
                  if (orangeUser) {
                    console.log('[WARNING]: [AUTH]: [ORANGE]: passport: signup: orange user already exist => SIGNIN');
                    return orangeUser;
                  }
                  return User.create({
                    role: 'user',
                    provider: 'orange',
                    ise2: orange.identity.collectiveidentifier,
                    orange: orange
                  });
                default:
                  throw new Error('unknown status ' + state.status);
              }
        })
        //
        // we create the user in the billing-api if he doesn't exist yet
        //
        .then(function (user) {
          console.log('[INFO]: [AUTH]: [ORANGE]: userReferenceUuid = ' + user._id);
          console.log('[INFO]: [AUTH]: [ORANGE]: userProviderUuid = ' + user.ise2);
          console.log('[INFO]: [AUTH]: [ORANGE]: OrangeApiToken = ' + orange.identity.OrangeAPIToken);
          return billingApi.getOrCreateUser({
            providerName: 'orange',
            userReferenceUuid: user._id,
            userProviderUuid: user.ise2,
            userOpts: {
              email: user.email || '',
              firstName: user.first_name || '',
              lastName: user.last_name || '',
              OrangeApiToken: orange.identity.OrangeAPIToken
            }
          }).then(function () { return user; });
        })
        .then(
          function success(user) { return user; },
          function error(err) {
            console.error('[ERROR]: [AUTH]: [ORANGE]: passport: '+err.message, err);
            throw err; // forwarding the error.
          }
        )
        .nodeify(done);
    }));
};
