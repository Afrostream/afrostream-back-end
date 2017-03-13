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
    if (!client ||
        (!client.isOrange() &&
         !client.isOrangeNewbox())) {
      return false;
    }
    if (model.name === 'Category' ||
        model.attributes.genre) {
      return true;
    }
    return false;
  },
  function conditions() {
    return {genre: {$ne: 'BET'}};
  }
);

module.exports = filter;
