const cls = require('continuation-local-storage');
cls.createNamespace('req.context');

module.exports = () => (req, res, next) => {
  let namespace = cls.getNamespace('req.context');

  namespace.bindEmitter(req);
  namespace.bindEmitter(res);
  namespace.run(function() {
      namespace.set('req', req);
      namespace.set('res', res);
      next();
  });
};
