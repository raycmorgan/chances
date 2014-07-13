/** @jsx */
'use strict';

var React = require('react');
var _ = require('underscore');
var Github = require('../github');
var Dispatcher = require('../dispatchers/app_dispatcher');

// -- Private store variables

var token = localStorage['ch-token'];
var validToken = true;
var validatingToken = false;
var changeListeners = [];

// -- Private store functions

function emitChange() {
  changeListeners.forEach(fn => fn());
}

function validateToken() {
  validatingToken = true;

  function valid(isValid) {
    return function () {
      validToken = isValid;
      validatingToken = false;

      Dispatcher.handleStoreAction('token.valid', {
        isValid: isValid
      });

      emitChange();
    }
  }

  Github(token)
    .user.get()
    .then(valid(true), valid(false));
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
  token = data.token;

  if (token) {
    localStorage['ch-token'] = token;
    validateToken();
  }

  emitChange();
  return true;
}

function deleteToken() {
  token = null;
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
  getToken: () => token,
  isValidatingToken: () => validatingToken,
  isTokenValid: () => validToken
}
