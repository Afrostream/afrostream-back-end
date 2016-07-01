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
      //req don't have user, so we pass it in query
      var state = req.body.RelayState ? new Buffer(req.body.RelayState || '', 'base64').toString('ascii') : '{}';
      state = JSON.parse(state);
      var status = state.status || 'signup';
      var userId = req.user ? req.user._id : state.userId;

      console.log('[INFO]: [ORANGE]: userId ', userId);
      console.log('[INFO]: [ORANGE]: orange ', orange);

      var c = {
        user: null
      };

      bluebird.resolve(req.user)
        .then(function (user) {
          // user exist => continue
          if (user) {
            console.log('[INFO]: [ORANGE]: req.user exist');
            return user;
          }
          // missing in req.user ? => fetching in DB
          var whereUser = [{'orange.identity.collectiveidentifier': orange.identity.collectiveidentifier}, {'ise2': orange.identity.collectiveidentifier}];

          return User.find({
            where: {
              $or: whereUser
            }
          });
        })
        .then(function (user) {
          // user exist => continue
          if (user) {
            console.log('[INFO]: [ORANGE]: user found in database using ise2');
            return user;
          }
          // missing => searching using userId
          if (userId) {
            return User.find({
              where: {'_id': userId}
            });
          }
          // no user
          return null;
        })
        .then(function (user) {
          if (user) {
            console.log('[INFO]: [ORANGE]: user found in database using userId');
            if (userId && !Object.is(parseInt(userId), parseInt(user._id))) {
              throw new Error('Your orange is already linked to another user');
            }
            // user exist => update
            user.ise2 = orange.identity.collectiveidentifier;
            user.orange = orange;
            return user.save();
          }
          // new user
          if (status === 'signin') {
            throw new Error('No user found, please associate your profile after being connected');
          }
          // create
          console.log('[INFO]: [ORANGE]: creating user with ise2 = ' + orange.identity.collectiveidentifier);
          return User.create({
            role: 'user',
            provider: 'orange',
            ise2: orange.identity.collectiveidentifier,
            orange: orange
          });
        })
        //
        // we create the user in the billing-api if he doesn't exist yet
        //
        .then(function (user) {
          console.log('[INFO]: [ORANGE]: userReferenceUuid = ' + user._id);
          console.log('[INFO]: [ORANGE]: userProviderUuid = ' + user.ise2);
          console.log('[INFO]: [ORANGE]: OrangeApiToken = ' + orange.identity.OrangeAPIToken);
          c.user = user;
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
          });
        })
        .then(function () {
          return c.user;
        })
        .nodeify(done);
    }));
};
