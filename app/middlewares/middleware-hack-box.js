var Client = rootRequire('sqldb').Client;

var _ = require('lodash');

var regexBoxId = /^box_._(\d+)$/;
var urlRegexBoxId = /box_._(\d+)/g;

function getClient(req) {
  return req.passport && req.passport.client ||
         // should be removed ...
         req.user && req.user instanceof Client.Instance && req.user ||
         null;
}

function isBoxClient(req) {
  var client = getClient(req);

  // tempfix: on n'active ce patch que sur bouygues miami
  return client && client.isBouyguesMiami();
  /*
      (client.isOrange() ||
       client.isOrangeNewbox() ||
       client.isBouyguesMiami());
       */
}

/*
 * this function recursively iterate on object value
 *  replacing value[X] by value[Y] with replace = { X: Y }
 *
 * ex: recursiveReplaceXbyY({a:"b", c:"d", d:{c:"d", o: 3} e:"f"}, {a:"c"});
 */
 function recursiveReplaceXbyY(obj, x, y) {
   if (obj && obj[y]) {
     obj[x] = obj[y];
   }
   for (var property in obj) {
     if (obj.hasOwnProperty(property) && typeof obj[property] === "object") {
       recursiveReplaceXbyY(obj[property], x, y);
     }
   }
   return obj;
 }

/*
 * This function takes an object body,
 *  and replace all Key/Val _id: box_*_Number by _id: Number
 *
 *  ex: rewriteInputBody({ _id: 42, category: { _id: "box_c_4242" }, "B": "A" })
 *    =>
 *      { _id: 42, category: { _id: "4242" }, "B": "A" }
 */
function rewriteInputBody(body) {
  return JSON.parse(JSON.stringify(body, function (k, v) {
    if (k === '_id' && typeof v === 'string') {
      var m = v.match(regexBoxId);
      if (m) {
        return m[1];
      }
    }
    return v;
  }));
}

/*
 * This function takes an object
 *  and replace all Val matching box_*_Number with Number
 *
 *  ex: rewriteInputObjectValues({ foo: "box_c_4242" })
 *    =>
 *     { foo: "4242" }
 */
function rewriteInputObjectValues(params) {
  return JSON.parse(JSON.stringify(params, function (k, v) {
    if (typeof v === 'string') {
      var m = v.match(regexBoxId);
      if (m) {
        return m[1];
      }
    }
    return v;
  }));
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
 * This function will apply filters on
 *    req.query, req.params, req.body
 *  to transform virtual "__boxId" to real afrostream id.
 */
function rewriteInputs(req) {
  if (req.body && typeof req.body === 'object') {
    req.body = rewriteInputBody(req.body);
  }
  if (req.params) {
    req.params = rewriteInputObjectValues(req.params);
  }
  if (req.query) {
    req.query = rewriteInputObjectValues(req.query);
  }
  req.originalUrl = req.originalUrl.replace(urlRegexBoxId, "$1");
  req.url = req.url.replace(urlRegexBoxId, "$1");
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
 * This function will monkey patch res.json()
 *  to overwrite
 */
function rewriteOutputs(req, res, isBox) {
  var json = res.json.bind(res);
  // monkey patch
  res.json = function (body) {
    var replacer = req.app.get('json replacer');
    var spaces = req.app.get('json spaces');
    body = JSON.parse(stringify(body, replacer, spaces));
    json((isBox) ? recursiveReplaceXbyY(body, '_id', '__boxId') : strip(body, '__boxId'));
  };
}

// @see https://github.com/Afrostream/afrostream-back-end/issues/372
module.exports = function (options) {
  return function (req, res, next) {
    var isBox = isBoxClient(req);
    if (isBox) {
      // input filters
      rewriteInputs(req);
    }
    // output filter
    rewriteOutputs(req, res, isBox);
    //
    next();
  };
};
