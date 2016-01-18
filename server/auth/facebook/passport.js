var passport = require('passport');
var FacebookStrategy = require('passport-facebook');

exports.setup = function (User, config) {
  passport.use(new FacebookStrategy({
      clientID: config.facebook.clientID,
      clientSecret: config.facebook.clientSecret,
      callbackURL: config.facebook.callbackURL,
      enableProof: true,
      profileFields: [
        'displayName',
        'emails'
      ],
      passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function (req, accessToken, refreshToken, profile, done) {
      // check if the user is already logged in
      if (!req.user) {
        User.find({
            where: {
              'facebook.id': profile.id
            }
          })
          .then(function (user) {
            if (user) {
              return done(null, user);
            }
            // if there is no user, create them
            user = User.build({
              name: profile.displayName,
              email: profile.emails[0].value,
              role: 'user',
              provider: 'facebook',
              facebook: profile._json
            });
            user.save()
              .then(function (user) {
                return done(null, user);
              })
              .catch(function (err) {
                return done(err);
              });
          })
          .catch(function (err) {
            return done(err);
          });
      } else {
        // user already exists and is logged in, we have to link accounts
        var user = req.user; // pull the user out of the session
        user.updateAttributes({
            facebook: profile._json
          })
          .then(function (linkedUser) {
            return done(null, linkedUser);
          }).catch(function (err) {
          return done(err);
        });
      }
    }));
};
