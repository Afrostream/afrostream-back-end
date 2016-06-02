var bluebird = require('bluebird');
var passport = require('passport');
var BouyguesStrategy = require('./passport/');
var billingApi = rootRequire('/server/billing-api.js');

exports.setup = function (User, config) {
  passport.use(new BouyguesStrategy({
      clientID: config.bouygues.clientID,
      clientSecret: config.bouygues.clientSecret,
      callbackURL: config.bouygues.callbackURL,
      passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function (req, accessToken, refreshToken, profile, done) {
      var state = req.query.state;
      var email = profile.emails[0].address;

      bluebird.resolve(req.user)
        .then(function (user) {
          // user exist => continue
          if (user) return user;
          // missing in req.user ? => fetching in DB
          var whereUser = [{'bouygues.id': profile.id}, {'bouyguesId': profile.id}];
          if (state !== 'signin') {
            whereUser.push({'email': {$iLike: email}});
          }
          return User.find({
            where: {
              $or: whereUser
            }
          });
        })
        .then(function (user) {
          if (user) {
            if (profile.id && profile.id != user.bouyguesId && profile.id != user.bouygues.id) {
              throw new Error('Your profile is already linked to another user');
            }
            // user exist => update
            user.name = user.name || profile.displayName;
            user.bouyguesId = profile.id;
            user.bouygues = profile._json;
            return user.save();
          } else {
            if (state === 'signin') {
              throw new Error('No user found, please associate your profile with bouygues after being connected');
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
          return billingApi.getOrCreateUser({
            providerName: 'bouygues',
            userReferenceUuid: user._id,
            userProviderUuid: user.bouyguesId,
            userOpts: {
              email: user.email || '',
              firstName: user.first_name || '',
              lastName: user.last_name || ''
            }
          }).then(function () {
            return user;
          });
        })
        .nodeify(done);
    }));
};
