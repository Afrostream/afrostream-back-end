var bluebird = require('bluebird');
var passport = require('passport');
var BouyguesStrategy = require('./passport/');
var billingApi = rootRequire('/server/billing-api.js');

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
      callbackURL: config.bouygues.callbackURL,
      passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function (req, accessToken, refreshToken, profile, done) {
      //req don't have user, so we pass it in query
      var state = req.query.state ? new Buffer(req.query.state, 'base64').toString('ascii') : '{}';
      state = JSON.parse(state);
      var status = state.status;
      var email = profile.emails && profile.emails[0] && profile.emails[0].address;
      var userId = req.user ? req.user._id : state.userId;
      console.log('bouygues user', userId);
      console.log('bouygues profile id', profile.id);

      var c = {
        user: null
      };

      bluebird.resolve(req.user)
        .then(function (user) {
          // user exist => continue
          if (user) return user;
          // missing in req.user ? => fetching in DB
          var whereUser = [{'bouygues.id': profile.id}, {'bouyguesId': profile.id}];
          if (status !== 'signin') {
            whereUser.push({'email': {$iLike: email}});
          }
          return User.find({
            where: {
              $or: whereUser
            }
          });
        })
        .then(function (user) {
          if (!user && userId) {
            return User.find({
              where: {'_id': userId}
            });
          } else {
            return user;
          }
        })
        .then(function (user) {
          if (user) {
            if (userId && userId != user._id) {
              throw new Error('Your profile is already linked to another user');
            }
            // user exist => update
            user.name = user.name || profile.displayName;
            user.bouyguesId = profile.id;
            user.bouygues = profile._json;
            return user.save();
          } else {
            if (status === 'signin') {
              throw new Error('No user found, please associate your profile after being connected');
            }

            // new user => create
            return User.create({
              name: profile.displayName,
              email: email,
              first_name: profile.name.givenName,
              last_name: profile.name.familyName,
              role: 'user',
              provider: 'bouygues',
              bouyguesId: profile.id,
              bouygues: profile._json
            });
          }
        })
        //
        // we create the user in the billing-api if he doesn't exist yet
        //
        .then(function (user) {
          c.user = user;
          return billingApi.getOrCreateUser({
            providerName: 'bouygues',
            userReferenceUuid: user._id,
            userProviderUuid: user.bouyguesId,
            userOpts: {
              email: user.email || '',
              firstName: user.first_name || '',
              lastName: user.last_name || ''
            }
          })
        })
        .then(function () {
          return c.user;
        })
        .nodeify(done);
    }));
};
