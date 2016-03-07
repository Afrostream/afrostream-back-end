var bluebird = require('bluebird');
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
        'emails',
        'name'
      ],
      passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function (req, accessToken, refreshToken, profile, done) {
      bluebird.resolve(req.user)
        .then(function (user) {
          // user exist => continue
          if (user) return user;
          // missing in req.user ? => fetching in DB
          return User.find({
            where: {
              $or: [{'facebook.id': profile.id},
                {'email': {$iLike: profile.emails[0].value}}]
            }
          });
        })
        .then(function (user) {
          if (user) {
            // user exist => update
            user.facebook = profile._json;
            return user.save();
          } else {
            // new user => create
            return User.create({
              name: profile.displayName,
              email: profile.emails[0].value,
              first_name: profile.name.givenName,
              last_name: profile.name.familyName,
              role: 'user',
              provider: 'facebook',
              facebook: profile._json
            });
          }
        }).nodeify(done);
    }));
};
