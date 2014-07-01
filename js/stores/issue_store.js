/** @jsx React.DOM */
'use strict';

var Github = require('../github');
var AuthenticationStore = require('./authentication_store');
var LabelStore = require('./label_store');
var helpers = require('../helpers');
var _ = require('underscore');
var query = require('../query');
var sessionStore = require('./session_store')('IssueStore.' + helpers.repoTuple());

var issues = [];
var changeListeners = [];

var defaultFilters = {
  includePullRequests: false
};

AuthenticationStore.addChangeListener(function () {
  if (AuthenticationStore.isTokenValid()) {
    syncIssues();
  }
});


// This is TERRIBAD. Need to move to a dispatcher/event model
// and only change when labels are selected, etc.
LabelStore.addChangeListener(emitChange);

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

function currentQuery() {
  var q = {};
  var filters = sessionStore.fetch('filters', defaultFilters);

  if (!filters.includePullRequests) {
    q['pull_request'] = {$exists: false};
  }

  var groupedLabels = LabelStore.getGroupedLabels();

  _.map(groupedLabels, function (labels, groupName) {
    labels = _.map(labels, (l) => l['name']);
    var selected = _.filter(labels, LabelStore.isLabelSelected);

    if (selected.length) {
      
    }
  });

  return q;
}

module.exports = {
  addChangeListener: (fn) => changeListeners.push(fn),
  removeChangeListener: function (fn) {
    changeListeners = _.reject(changeListeners, (f) => fn == f);
  },

  getIssues: function () {
    return query.filter(issues, currentQuery());
  },

  //

  setIncludePullRequests: function (v) {
    sessionStore.update('filters', function (filters) {
      filters['includePullRequests'] = v;
      return filters;
    }, defaultFilters);

    emitChange();
  },

  includePullRequests: function () {
    return sessionStore.fetch('filters', defaultFilters)['includePullRequests'];
  },

  //

  selectIssue: function (id) {
    sessionStore.update('selected', function (selected) {
      return selected.concat(id);
    }, []);

    emitChange();
  },

  unselectIssue: function (id) {
    sessionStore.update('selected', function (selected) {
      return _.reject(selected, (i) => i == id);
    }, []);
    
    emitChange();
  },

  isIssueSelected: function (id) {
    return _.contains(sessionStore.fetch('selected'), id);
  }
};
