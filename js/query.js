/** @jsx */
var _ = require('underscore');
var assert = require('assert');

function queryFilter(objects, query) {
  return _.filter(objects, function (o) {
    return queryMatch(o, query)
  });
}

function queryMatch(obj, query) {
  return _.every(query, function (queryPart, key) {
    if (_.contains(['$and', '$or', '$nor'], key)) {
      assert(Array.isArray(queryPart), 'Value of ' + key + ' must be an array');
      var recur = _.partial(queryMatch, obj);
 
      switch (key) {
        case '$and': return _.every(queryPart, recur);
        case '$or': return _.some(queryPart, recur);
        case '$nor': return !_.some(queryPart, recur);
      }
    }
 
    var val = obj[key];
 
    if (typeof(queryPart) === 'object') {
      var operators = filterHash(queryPart, function (v, k) {
        return k.indexOf('$') === 0;
      });

      var nestedQuery = filterHash(queryPart, function (v, k) {
        return k.indexOf('$') !== 0;
      });

      var nestedQueryMatch = queryMatch.bind(this, val);

      var matches = function (v) {
        return testOps(operators, v) && queryMatch(v, nestedQuery);
      }

      if (Array.isArray(val)) {
        return _.some(val, matches);
      } else {
        return matches(val);
      }
    } else if (val === queryPart) {
      return true;
    } else {
      return false;
    }
  });
}

function testOps(ops, val) {
  return _.every(ops, function _check(p, op) {
    if (op === '$not') {
      return !_.every(p, _check);
    }

    var typeMatch = typeof(p) === typeof(val);

    switch (op) {
      case '$gt': return typeMatch && val > p;
      case '$lt': return typeMatch && val < p;
      case '$gte': return typeMatch && val >= p;
      case '$lte': return typeMatch && val <= p;
      case '$in': return _.contains(p, val);
      case '$ne': return p !== val;
      case '$nin': return !_.contains(p, val);
      case '$exists': return (p && val !== undefined) || (!p && val === undefined);
      default: throw new Error('Unknown operator: ' + op);
    }
  });
}

function filterHash(hash, fn) {
  var keys = Object.keys(hash);
  var newHash = {};

  _.each(keys, function (k) {
    if (fn(hash[k], k)) {
      newHash[k] = hash[k];
    }
  });

  return newHash;
}

exports.filter = queryFilter;
exports.match = queryMatch;
