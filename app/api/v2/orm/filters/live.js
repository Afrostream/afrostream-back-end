const sqldb = rootRequire('sqldb');

const filter = sqldb.helper.createQueryOptionsFilter();

filter.setVisitor(
  function when(model, queryOptions, root, options) {
    const { req } = options;
    const client = req && req.passport && req.passport.client;

    // no contextual request infos => skip filter.
    if (!req) {
      return false;
    }
    // model can't be filtered on "live"
    if (!model.attributes.live) {
      return false;
    }
    // client without filtering
    if (client &&
        (client.isBouyguesMiami() ||
         client.isOrange() ||
         client.isOrangeNewbox())) {
      return true;
    }
    // model can be filtered
    return false;
  },
  function conditions() {
    return {live: {$ne: true}};
  }
);

module.exports = filter;
