var assert = require('assert');
var query = require('../js/query');

describe('query', function (){
  var m = query.match;

  it('works', function () {
    assert.equal(true,  m({a: 'b'}, {}));
    assert.equal(true,  m({a: 'b'}, {a: 'b'}));
    assert.equal(false, m({a: 'b'}, {a: 'c'}));
    assert.equal(false, m({a: 'b'}, {b: 'b'}));
  });

  it('supports $lt', function () {
    assert.equal(true,  m({a: 1}, {a: {'$lt': 2}}));
    assert.equal(false, m({a: 1}, {a: {'$lt': 1}}));
    assert.equal(false, m({a: 1}, {a: {'$lt': 0}}));
  });

  it('supports $lte', function () {
    assert.equal(true,  m({a: 1}, {a: {'$lte': 2}}));
    assert.equal(true,  m({a: 1}, {a: {'$lte': 1}}));
    assert.equal(false, m({a: 1}, {a: {'$lte': 0}}));
  });

  it('supports nested query', function () {
    var o = {person: {name: 'jim', age: 24}};

    assert.equal(true, m(o, {person: {name: 'jim'}}));
    assert.equal(true, m(o, {person: {age: {'$lt': 25}}}));

    assert.equal(false, m(o, {person: {name: 'tom'}}));
  });

  it('nested query with array', function () {
    var o = {
      people: [
        {name: 'jim', age: 25},
        {name: 'tom', age: 27}
      ]
    };

    assert.equal(true, m(o, {people: {name: 'jim'}}));
    assert.equal(true, m(o, {people: {age: {'$gt': 26}}}));
    assert.equal(true, m(o, {people: {age: {'$in': [26, 27]}}}));

    assert.equal(false, m(o, {people: {name: 'bob'}}));
  });
});