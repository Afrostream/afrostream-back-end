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
    // model can't be filtered on "dateFrom/dateTo"
    if (!model.attributes.dateFrom || !model.attributes.dateTo) {
      return false;
    }
    // explicit filter skip
    if (req.query.filterDateFromTo === 'false') {
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
  function conditions() {
    const now = new Date();

    // (dateFrom is null and dateTo is null) OR
    // (dateFrom is null and dateTo > Date.now()) OR
    // (dateTo is null and dateFrom < Date.now()) OR
    // (dateFrom < Date.now() AND dateTo > Date.now())
    return [
        {dateFrom: null, dateTo: null},
        {dateFrom: null, dateTo: {$gt: now}},
        {dateTo: null, dateFrom: {$lt: now}},
        {dateFrom: {$lt: now}, dateTo: {$gt: now}}
    ];
  }
);

module.exports = filter;
