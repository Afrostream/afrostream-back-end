const filters = rootRequire('app/api/filters.js');

/*
 * res.json(entity) will be automaticaly filtered.
 *  using specific Entity.getPlain() func.
 *
 * use res.json(entity, {filtered:false})
 *  if you don't want your content to be filtered.
 */
module.exports = () => {
  return (req, res, next) => {
    const json = res.json.bind(res);
    // monkey patch
    res.json = function (body, options) {
      // default is filtered output
      const isFiltered = !options || typeof options.filter === 'undefined' || options.filter;
      if (isFiltered) {
        // injecting request
        options = options || {};
        options.req = req;
        // giving clues to the client
        res.set('afr-middleware-filtered', 'true');
        json(filters.filterOutput(body, options));
      } else {
        res.set('afr-middleware-filtered', 'false');
        json(body);
      }
    };
    next();
  };
};
