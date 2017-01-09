var Client = rootRequire('sqldb').Client;

function getClient(req) {
  return req.passport && req.passport.client ||
         // should be removed ...
         req.user && req.user instanceof Client.Instance && req.user ||
         null;
}

function isTappticClient(req) {
  var client = getClient(req);

  // tempfix: on n'active ce patch que sur bouygues miami
  return client && client.isTapptic();
}

// from expressjs source code.
function stringify(value, replacer, spaces) {
  // v8 checks arguments.length for optimizing simple call
  // https://bugs.chromium.org/p/v8/issues/detail?id=4730
  return replacer || spaces
    ? JSON.stringify(value, replacer, spaces)
    : JSON.stringify(value);
}

/*
 * This function strip key from input object o
 *
 *  ex: strip({ id: 42, __boxId: 45, c: "d" }, "__boxId")
 *    =>
 *      { id: 42, c: "d" }
 */
function strip(o, key) {
  return JSON.parse(JSON.stringify(o, function (k, v) {
    return k === key ? undefined : v;
  }));
}

/*
 * This function will monkey patch res.json()
 *  to overwrite
 */
function rewriteOutputs(req, res) {
  var json = res.json.bind(res);
  // monkey patch
  res.json = function (body) {
    var replacer = req.app.get('json replacer');
    var spaces = req.app.get('json spaces');

    body = JSON.parse(stringify(body, replacer, spaces));
    body = strip(body, 'countries');
    json(body);
  };
}

module.exports = function () {
  return function (req, res, next) {
    var isTapptic = isTappticClient(req);
    if (isTapptic) {
      // output filter
      rewriteOutputs(req, res);
    }
    //
    next();
  };
};
