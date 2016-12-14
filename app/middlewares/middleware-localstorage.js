const cls = require('continuation-local-storage');
cls.createNamespace('afrostream-back-end.incomming-request.context');

module.exports = () => (req, res, next) => {
  let namespace = cls.getNamespace('afrostream-back-end.incoming-request.context');

  namespace.bindEmitter(req);
  namespace.bindEmitter(res);
  namespace.run(function() {
      namespace.set('req', req);
      namespace.set('res', res);
      next();
  });
};
