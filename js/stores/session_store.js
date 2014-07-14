/** @jsx */
'use strict';

var _ = require('underscore');
var Github = require('../github');
var Dispatcher = require('../dispatchers/app_dispatcher');
var Promise = require('es6-promise').Promise;
var reqwest = require('reqwest');

// -- Private store variables

var validToken = true;
var validatingToken = false;
var changeListeners = [];

// -- Private store functions

function emitChange() {
  changeListeners.forEach(fn => fn());
}

function validateToken() {
  validatingToken = true;

  if (localStorage['ch-token']) {
    var apiRequest = Github(localStorage['ch-token']).user.get();
  } else {
    var apiRequest = new Promise(function (resolve) { resolve({}); });
  }

  var authPageReq = get('https://github.com/settings/profile');

  Promise
    .all([authPageReq, apiRequest])
    .then(valid(true), valid(false));

  function valid(isValid) {
    return function (result) {
      var currentUserId = localStorage['ch-userId'];

      validToken = isValid && (!currentUserId || currentUserId == result[1].id);
      validatingToken = false;

      if (validToken) {
        localStorage['ch-username'] = result[1].login;
        localStorage['ch-userId'] = result[1].id;
      } else {
        // If token is not valid or the userId does not match,
        // we need to kill the token so it doesn't stick around
        // in localStorage!

        console.info('Clearing chances authenticated data.');
        delete localStorage['ch-token'];
        delete localStorage['ch-username'];
        delete localStorage['ch-userId'];

        // TODO clear *ALL* local/session data
      }

      Dispatcher.handleStoreAction('token.valid', {
        isValid: validToken
      });

      emitChange();
    }
  }
}

// -- Setup

validateToken();

// -- Event Handling

var handlers = {
  'session.create': setToken,
  'session.delete': deleteToken,
};

var dispatchID = Dispatcher.register(function (event) {
  if (typeof handlers[event.type] === 'function') {
    handlers[event.type](event.action);
  }

  return true;
});

function setToken(data) {
  if (data.token) {
    localStorage['ch-token'] = data.token;
    validateToken();
  }

  emitChange();
  return true;
}

function deleteToken() {
  validToken = false;
  delete localStorage['ch-token'];

  emitChange();
  return true;
}

// -- Public interface

module.exports = {
  addChangeListener: (fn) => changeListeners.push(fn),
  removeChangeListener: function (fn) {
    changeListeners = _.reject(changeListeners, (f) => fn == f);
  },

  getDispatchID: () => dispatchID,
  getToken: () => localStorage['ch-token'],
  isValidatingToken: () => validatingToken,
  isTokenValid: () => validToken
}


function get(url, data, headers) {
  // logger.info('HTTP request: GET %s', url, data, headers);

  return new Promise(function (resolve, reject) {
    var r = reqwest({
      url: url,
      method: 'get',
      type: 'html',
      headers: headers || {},
      data: data || {},
      error: reject,
      success: resolve
    });
  });
}