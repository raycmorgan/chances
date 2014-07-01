/** @jsx */
var _ = require('underscore');

function queryFilter(objects, query) {
  return _.filter(objects, (o) => queryMatch(o, query));
}

function queryMatch(obj, query) {
  return _.every(query, function (pred, key) {
    if (_.contains(['$and', '$or', '$nor'], key)) {
      assert(Array.isArray(pred), 'Value of ' + key + ' must be an array');
      var recur = _.partial(queryMatch, obj);
 
      switch (key) {
        case '$and': return _.every(pred, recur);
        case '$or': return _.some(pred, recur);
        case '$nor': return !_.some(pred, recur);
      }
    }
 
    var val = obj[key];
 
    if (typeof(pred) === 'object') {
      return _.every(pred, function _check(p, op) {
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
    } else if (val === pred) {
      return true;
    } else {
      return false;
    }
  });
}

exports.filter = queryFilter;
exports.match = queryMatch;



// {labels: {name: 'foo'}}
