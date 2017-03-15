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
    // model can't be filtered on "tenant"
    if (!model.attributes.tenantId) {
      return false;
    }
    // client without filtering
    if (!client || !client.get('tenantId')) {
      return false;
    }
    // filtering on tenant.
    return true;
  },
  function conditions(model, queryOptions, root, options) {
    return { tenantId: options.req.client.get('tenantId') };
  }
);

module.exports = filter;
