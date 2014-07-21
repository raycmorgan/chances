/** @jsx React.DOM */
'use strict';

var queryMatch = require('../query').match;
var Promise = require('es6-promise').Promise;
var _ = require('underscore');

var IssueCollection = {
  version: 4,
  name: 'issues',
  primary: 'id',
  
  indexes: [
    {name: 'created_at', keyPath: 'created_at'},
    {name: 'updated_at', keyPath: 'updated_at'},
    {name: 'comments', keyPath: 'comments'},
  ],

  insert: function (obj, callback) {
    db.insert('issues', obj, callback);
  },

  get: function (id, callback) {
    db.get('issues', id, callback);
  },

  find: function (query, opts, callback) {
    // (opts.order) [BOOL]
    // (opts.limit) [Integer]
    if (!opts.index) {
      db.find('issues', query, opts, callback);
    } else {
      db.indexedFind('issues', opts.index, query, opts, callback);
    }
  },

  findOne: function (query, opts, callback) {
    opts.limit = 1;
    IssueCollection.find(query, opts, function (err, values, info) {
      if (values && values.length) {
        callback(err, values[0], info);
      } else {
        callback(err, null, info);
      }
    });
  }
};


var __db = null;

function open() {
  if (__db) {
    return __db;
  }

  var collections = [IssueCollection];
  var version = collections.reduce((acc, c) => acc + c.version, 0);
  var request = indexedDB.open('pourover', version);

  __db = new Promise((resolve, reject) => {
    request.onupgradeneeded = function (e) {
      var db = e.target.result;
      var transaction = e.target.transaction;

      transaction.onerror = (e) => reject(e.target.error);

      collections.forEach((c) => {
        // Remove the old version of the store (instead of dealing with upgrades)
        if (db.objectStoreNames.contains(c.name)) {
          db.deleteObjectStore(c.name);
        }

        var store = db.createObjectStore(c.name, {keyPath: c.primary});

        (c.indexes || []).forEach((i) => {
          store.createIndex(i.name, i.keyPath);
        });
      });
    };

    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });

  return __db;
}


var db = {
  insert: function (name, obj, callback) {
    return __db.then((db) => {
      var txn = db.transaction([name], 'readwrite');
      var store = txn.objectStore(name);

      var request = store.put(obj);

      request.onsuccess = (e) => callback();
      request.onerror = (e) => callback(e.target.error);
    });
  },

  get: function (name, id, callback) {
    return __db.then((db) => {
      var txn = db.transaction([name], 'readonly');
      var store = txn.objectStore(name);

      var request = store.get(id);

      request.onsuccess = (e) => callback(null, e.target.result);
      request.onerror = (e) => callback(e.target.error);
    });
  },

  find: function (name, query, opts, callback) {
    opts = opts || {};

    var limit = opts.limit || Infinity;
    var skip  = opts.skip  || 0;
    var order = opts.order || 'asc';

    return __db.then((db) => {
      var txn = db.transaction([name], 'readonly');
      var store = txn.objectStore(name);

      var request = store.openCursor();

      var values = [];
      var skipped = 0;

      var info = {
        index: null,
        scanned: 0,
        selected: 0,
        keyRange: '[...]',
        indexedSort: false,
        memorySort: false,
        memorySlice: false,
      };

      request.onsuccess = processCursor(txn, query, limit, skip, order, info, callback);
      request.onerror = (e) => callback(e.target.error);
    });
  },

  indexedFind: function (name, indexName, query, opts, callback) {
    opts = opts || {};

    var limit = opts.limit || Infinity;
    var skip  = opts.skip  || 0;
    var order = opts.order || null;

    return __db.then((db) => {
      var txn = db.transaction([name], 'readonly');
      var store = txn.objectStore(name);
      var index = store.index(indexName);

      var keyPath = index.keyPath;

      var info = {
        index: indexName,
        scanned: 0,
        selected: 0,
        keyRange: null,
        indexedSort: null,
        memorySort: false,
        memorySlice: false,
      };

      var keyRange = undefined;

      if (typeof query[keyPath] == 'string') {
        keyRange = IDBKeyRange.only(query[keyPath]);
        info.keyRange = '[' + query[keyPath] + ']';
      } else if (typeof query[keyPath] == 'object') {
        var q = query[keyPath];

        var lowerBound = q['$gt'] || q['$gte'];
        var lowerBoundInclusive = !q['$gte'];

        var upperBound = q['$lt'] || q['$lte'];
        var upperBoundInclusive = !q['$lte'];

        if (lowerBound && upperBound) {
          var keyRange = IDBKeyRange.bound(lowerBound, upperBound, lowerBoundInclusive, upperBoundInclusive);
        } else if (lowerBound) {
          var keyRange = IDBKeyRange.lowerBound(lowerBound, lowerBoundInclusive);
        } else if (upperBound) {
          var keyRange = IDBKeyRange.upperBound(upperBound, upperBoundInclusive);
        } else {
          var keyRange = undefined;
        }

        if (keyRange) {
          info.keyRange = '';
          info.keyRange += keyRange.lower && keyRange.lowerOpen ? '(' : '[';
          info.keyRange += keyRange.lower ? keyRange.lower : '';
          info.keyRange += '...';
          info.keyRange += keyRange.upper ? keyRange.upper : '';
          info.keyRange += keyRange.upper && keyRange.upperOpen ? ')' : ']';
        }
      } else {
        info.keyRange = '[...]';
      }

      var request, indexedSort;

      if (order && order[0] === keyPath) {
        request = index.openCursor(keyRange, order[1] === 'desc' ? 'prev' : 'next');
        info.indexedSort = true;
      } else {
        request = index.openCursor(keyRange);

        if (order) {
          info.indexedSort = false;
        }
      }

      request.onsuccess = processCursor(txn, query, limit, skip, order, info, callback);
      request.onerror = (e) => callback(e.target.error, null, info);
    });
  }
};


function processCursor(txn, query, limit, skip, order, info, callback) {
  var values = [];
  var skipped = 0;

  return function(e) {
    var cursor = e.target.result;

    var exactOrder = (!order || info.indexedSort);
    var continueScan = (!exactOrder || values.length < limit);

    if (cursor && continueScan) {
      if (cursor) {
        info.scanned++;
      }

      var value = cursor.value;

      if (queryMatch(value, query)) {
        info.selected++;

        if (skipped >= skip) {
          values.push(cursor.value);
        } else {
          skipped++;
        }
      }

      if (exactOrder && values.length >= limit) {
        txn.abort(null);
        callback(null, values, info);
      } else {
        cursor.continue();
      }
    } else {
      txn.abort(null);

      if (order) {
        info.memorySort = true;
        values = _.sortBy(values, function (v) {
          return v[order[0]];
        });

        if (order[1] === 'desc') {
          values = values.reverse();
        }
      }

      if (limit && values.length > limit) {
        info.memorySlice = true;
        values = values.slice(0, limit);
      }

      callback(null, values, info);
    }
  };
}

exports.IssueCollection = IssueCollection;
exports.open = open;

// IssueCollection.find({}, {order: 'desc', limit: 1}, 'updated_at');
// index.openCursor('prev');


// IssueCollection.find({'author': 'raycmorgan'}, {}, 'author');
// var keyRange = IDBKeyRange.only('raycmorgan');
// index.openCursor(keyRange);



// var opts = {order: 'desc', limit: 1, index: 'updated_at'};

// IssueCollection.find({}, opts, (err, values, info) => {
//   if (err) return console.error(err);
//   console.log(values, info);
// });


// var query = {comments: {$gte: 1, $lt: 10}, user: {login: 'josevalim'}};
// var opts = {
//   order: ['updated_at', 'desc'],
//   limit: 10,
//   index: 'comments',
// };

// IssueCollection.find(query, opts, (err, values, info) => {
//   if (err) { return console.error(err); }
//   console.log(values, info);
// });
