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
    // model can't be filtered on "broadcasters"
    if (!model.attributes.broadcasters) {
      return false;
    }
    // explicit filter skip
    if (req.query.filterBroadcaster === 'false') {
      return false;
    }
    // client without filtering
    if (client &&
        (client.isAfrostreamAdmin() ||
         client.isAfrostreamExportsBouygues() ||
         client.isAfrostreamExportsOsearch() ||
         client.isAfrostreamExportsOCI() ||
         client.isAfrostreamExportsAlgolia())) {
      return false;
    }
    // model can be filtered
    return true;
  },
  function conditions(model, queryOptions, root, options) {
    return [
      {broadcasters: {$eq: []}},
      {broadcasters: {$eq: null}},
      {broadcasters: {$contains: [options.req.broadcaster._id]}}
    ];
  }
);

module.exports = filter;
