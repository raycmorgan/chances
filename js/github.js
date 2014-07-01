/** @jsx */
'use strict';

var reqwest = require('reqwest');
var EventEmitter = require('events').EventEmitter;
var Promise = require('es6-promise').Promise;
var _ = require('underscore');

function Github(token) {
  if (Github.cached[token]) {
    return Github.cached[token];
  }

  var host = 'https://api.github.com/';
  var priv = {
    get: function (path, data) {
      data = data || {};
      data['access_token'] = token;

      return get(host + path, data);
    },

    stream: function (path, opts) {
      opts = opts || {};
      opts['page'] = opts['page'] || 1;
      opts['per_page'] = opts['per_page'] || 30;

      var e = new EventEmitter();
      var cancelled = false;

      var handleError = (err) => e.emit('error', err);
      var handleData = function (data) {
        if (cancelled) {
          return;
        }

        // should optimize this by NOT making extra page req
        if (data.length) {
          e.emit('startChunk', data.length);
          _.each(data, function (d) {
            if (!cancelled) {
              e.emit('data', d);
            }
          });
          e.emit('endChunk');

          if (data.length < opts['per_page']) {
            return e.emit('end');
          } else if (!cancelled) {
            opts['page']++;
            fetchPage();
          }
        } else {
          e.emit('end');
        }
      }

      e.cancel = function () {
        cancelled = true;
        e.emit('end');
      }

      function fetchPage() {
        priv.get(path, opts).then(handleData, handleError);
      }
      fetchPage();

      return e;
    },
  };

  return Github.cached[token] = {
    issues: {
      get: (data) => priv.get('issues', data),
      stream: (data) => priv.stream('issues', data),
    },

    user: {
      get: () => priv.get('user'),
    },

    labels: {
      get: (data) => priv.get('labels', data)
    },

    repos: function (repoTuple) {
      var basePath = 'repos/' + repoTuple + '/';

      return {
        issues: {
          get: (data) => priv.get(basePath + 'issues', data),
          stream: (data) => priv.stream(basePath + 'issues', data),
        },

        labels: {
          get: (data) => priv.get(basePath + 'labels', data),
          stream: (data) => priv.stream(basePath + 'labels', data),
        },
      };
    }
  };
};
Github.cached = {};

function get(url, data, headers) {
  console.log('HTTP request: GET %s', url, data, headers);

  return new Promise(function (resolve, reject) {
    var r = reqwest({
      url: url,
      type: 'json',
      method: 'get',
      crossOrigin: true,
      headers: headers || {},
      data: data || {},
      error: reject,
      success: resolve
    });
  });
}

module.exports = Github;
