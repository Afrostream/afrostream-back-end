var Client = rootRequire('sqldb').Client;

var _ = require('lodash');

var regexBoxId = /^box_._(\d+)$/;

function getClient(req) {
  return req.passport && req.passport.client ||
         // should be removed ...
         req.user && req.user instanceof Client.Instance && req.user ||
         null;
}

function isBoxClient(req) {
  var client = getClient(req);

  return client &&
      (client.isOrange() ||
       client.isOrangeNewbox() ||
       client.isBouyguesMiami());
}

/*
 * this function recursively iterate on object value
 *  replacing value[X] by value[Y] with replace = { X: Y }
 *
 * ex: recursiveReplaceXbyY({a:"b", c:"d", d:{c:"d", o: 3} e:"f"}, {a:"c"});
 */
function recursiveReplaceXbyY(value, replace) {
  if (value == null ||
      typeof value === 'number' ||
      typeof value === 'boolean') {
    return value;
  } else if (typeof value === 'object') {
    if (typeof value.toJSON === 'function') {
      return recursiveReplaceXbyY(value.toJSON(), replace);
    } else if (Array.isArray(value)) {
      for (var i = 0; i < value.length; i++) {
        recursiveReplaceXbyY(value[i], replace);
      }
    } else if (toString.call(value) === '[object Object]') {
      Object.keys(replace).forEach(function (k) {
        if (value[replace[k]]) {
          value[k] = value[replace[k]];
        }
      });
      for (var k in value) {
        if (value.hasOwnProperty(k)) {
          recursiveReplaceXbyY(value[k], replace);
        }
      }
    }
  }
  return value;
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
}

/*
 * This function will monkey patch res.json()
 *  to overwrite
 */
function rewriteOutputs(req, res, isBox) {
  var json = res.json.bind(res);
  // monkey patch
  res.json = function (o) {
    json(isBox ? recursiveReplaceXbyY(_.merge({}, o), {'_id':'__boxId'}) : strip(o, '__boxId'));
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
