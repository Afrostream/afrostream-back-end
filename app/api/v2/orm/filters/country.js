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
    // model can't be filtered on "countries"
    if (!model.attributes.countries) {
      return false;
    }
    // explicit filter skip
    if (req.query.filterCountry === 'false') {
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
      {countries: {$eq: []}},
      {countries: {$eq: null}},
      {countries: {$contains: [options.req.country._id]}}
    ];
  }
);

module.exports = filter;
