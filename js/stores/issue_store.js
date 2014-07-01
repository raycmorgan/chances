/** @jsx React.DOM */
'use strict';

var Github = require('../github');
var AuthenticationStore = require('./authentication_store');
var helpers = require('../helpers');
var _ = require('underscore');

var issues = [];
var selectedIssues = [];
var changeListeners = [];

var filters = {};

AuthenticationStore.addChangeListener(function () {
  if (AuthenticationStore.isTokenValid()) {
    syncIssues();
  }
});

function syncIssues() {
  issues = [];

  var stream = Github(AuthenticationStore.getToken())
                .repos(helpers.repoTuple())
                .issues
                .stream();

  stream.on('data', (issue) => issues.push(issue));
  stream.on('endChunk', emitChange);
  stream.on('end', emitChange);
}

function emitChange() {
  _.each(changeListeners, fn => fn());
}

module.exports = {
  addChangeListener: (fn) => changeListeners.push(fn),
  removeChangeListener: function (fn) {
    changeListeners = _.reject(changeListeners, (f) => fn == f);
  },

  getIssues: function () {
    console.log(JSON.stringify(issues[0]));
    if (filters.includePullRequests) {
      return issues;
    } else {
      return _.filter(issues, (i) => !i['pull_request']);
    }
  },

  setFilter: function (key, value) {
    console.log('Setting filter %s to %s', key, value);
    filters[key] = value;
    emitChange();
  },
  getFilter: (key) => filters[key],

  selectIssue: function (id) {
    selectedIssues = selectedIssues.concat(id);
    emitChange();
  },

  unselectIssue: function (id) {
    selectedIssues = _.reject(selectedIssues, (i) => i == id);
    emitChange();
  },

  isIssueSelected: function (id) {
    return _.contains(selectedIssues, id);
  }
};
