const restrictToUserRole = requiredRole => {
  return (req, res, next) => {
    try {
      if (!req.passport) {
        const error = new Error('passport not loaded');
        error.statusCode = 401;
        throw error;
      }
      if (!req.passport.user) {
        const error = new Error('no user logged in');
        error.statusCode = 401;
        throw error;
      }
      if (!req.passport.user.hasRole(requiredRole)) {
        const error = new Error('missing privilege');
        error.statusCode = 401;
        throw error;
      }
      next();
    } catch (err) {
      res.handleError()(err);
    }
  };
};

const adminOnly = restrictToUserRole('admin');

/*
 * optimised version of v1 auth.service
 */
module.exports.middlewares = {
  restrictToUserRole: restrictToUserRole,
  adminOnly: adminOnly
};
