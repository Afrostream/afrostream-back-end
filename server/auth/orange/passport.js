var bluebird = require('bluebird');
var passport = require('passport');
var OrangeStrategy = require('./passport/');
var billingApi = rootRequire('/server/billing-api.js');

exports.setup = function (User, config) {
  passport.use(new OrangeStrategy({
      clientID: config.orange.clientID,
      clientSecret: config.orange.clientSecret,
      callbackURL: config.orange.callbackURL,
      passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function (req, profile, done) {
      //req don't have user, so we pass it in query
      var state = req.query.state ? new Buffer(req.query.state || '', 'base64').toString('ascii') : '{}';
      state = JSON.parse(state);
      var status = state.status || 'signup';
      var userId = req.user ? req.user._id : state.userId;

      console.log('orange user', userId);

      var c = {
        user: null,
        orangeAPIToken: profile.orangeAPIToken
      };

      bluebird.resolve(req.user)
        .then(function (user) {
          // user exist => continue
          if (user) return user;
          // missing in req.user ? => fetching in DB
          var whereUser = [{'orange.id': profile.id}, {'orangeId': profile.id}, {'_id': userId}];

          return User.find({
            where: {
              $or: whereUser
            }
          });
        })
        .then(function (user) {
          if (user) {
            if (userId && userId != user._id) {
              throw new Error('Your profile is already linked to another user');
            }
            // user exist => update
            user.orangeId = profile.id;
            user.orange = profile._json;
            return user.save();
          } else {
            if (status === 'signin') {
              throw new Error('No user found, please associate your profile after being connected');
            }

            // new user => create
            return User.create({
              role: 'user',
              provider: 'orange',
              orangeId: profile.id,
              orange: profile._json
            });
          }
        })
        //
        // we create the user in the billing-api if he doesn't exist yet
        //
        .then(function (user) {
          c.user = user;
          return billingApi.getOrCreateUser({
            providerName: 'orange',
            userReferenceUuid: user._id,
            userProviderUuid: user.orangeId,
            userOpts: {
              email: user.email || '',
              firstName: user.first_name || '',
              lastName: user.last_name || '',
              OrangeAPIToken: c.orangeAPIToken
            }
          })
        })
        .then(function () {
          return c.user;
        })
        .nodeify(done);
    }));
};
