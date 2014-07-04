/** @jsx */
'use strict';

var React = require('react');
var _ = require('underscore');
var Github = require('../github');
var AppDispatcher = require('../app_dispatcher');

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
      emitChange();
    }
  }

  Github(token)
    .user.get()
    .then(valid(true), valid(false));
}

// -- Setup

validateToken();

// -- Public interface

module.exports = {
  addChangeListener: (fn) => changeListeners.push(fn),
  removeChangeListener: function (fn) {
    changeListeners = _.reject(changeListeners, (f) => fn == f);
  },

  getToken: () => token,
  setToken: function (newToken) {
    token = newToken;

    if (token) {
      localStorage['ch-token'] = token;
      validateToken();
    } else {
      validToken = false;
      delete localStorage['ch-token'];
    }
    
    emitChange();
  },

  isValidatingToken: () => validatingToken,
  isTokenValid: () => validToken
}