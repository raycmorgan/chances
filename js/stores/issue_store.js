/** @jsx React.DOM */
'use strict';

var Github = require('../github');
var AuthenticationStore = require('./authentication_store');
var LabelStore = require('./label_store');
var helpers = require('../helpers');
var _ = require('underscore');
var query = require('../query');
var sessionStore = require('./session_store')('IssueStore.' + helpers.repoTuple());

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
  var issues = [];

  var stream = Github(AuthenticationStore.getToken())
                .repos(helpers.repoTuple())
                .issues
                .stream();

  stream.on('data', (issue) => issues.push(issue));
  stream.on('endChunk', emitChange);
  stream.on('end', function () {
    sessionStore.update('issues', function () {
      return issues;
    });

    emitChange();
  });
}

function emitChange() {
  _.each(changeListeners, fn => fn());
}

function currentQuery() {
  var q = {
    '$and': []
  };
  var filters = sessionStore.fetch('filters', defaultFilters);

  if (!filters.includePullRequests) {
    q['pull_request'] = {$exists: false};
  }

  var groupedLabels = LabelStore.getGroupedLabels();

  _.each(groupedLabels, function (labels, groupName) {
    labels = _.map(labels, (l) => l['name']);
    var selected = _.filter(labels, LabelStore.isLabelSelected);

    if (selected.length) {
      q['$and'].push({labels: {name: {'$in': selected}}});
    }
  });

  _.each(LabelStore.getNonGroupedLabels(), function (label) {
    if (LabelStore.isLabelSelected(label.name)) {
      q['$and'].push({labels: {name: label.name}});
    }
  });

  return q;
}

function remoteToLocal(issue) {
  var i = {};

  function copyKeys(o, o2, keys) {
    _.each(keys, function (k) {
      o2[k] = o[k];
    });
  }

  function toLocalUser(user) {
    if (!user) {
      return null;
    }

    return {
      'id': user['id'],
      'login': user['login'],
      'avatar_url': user['avatar_url'],
      'type': user['type'],
      'url': user['url']
    };
  }

  copyKeys(issue, i, [
    'id',
    'number',
    'title',
    'body',
    'state',
    'url',
    'comments',
    'created_at',
    'updated_at',
    'closed_at',
  ]);
  
  i['labels'] = _.map(issue['labels'], function (l) {
    return {name: l.name, color: l.color};
  });

  i['user'] = toLocalUser(issues['user']);

  var milestone = issues['milestone'];
  if (milestone) {
    var m = {};

    copyKeys(milestone, m, [
      'id',
      'number',
      'title',
      'open_issues',
      'closed_issues',
      'created_at',
      'updated_at',
      'description',
      'due_on',
      'state',
      'url'
    ]);

    m['creator'] = toLocalUser(milestone['creator']);
    i['milestone'] = m;
  }

  return i;
}

module.exports = {
  addChangeListener: (fn) => changeListeners.push(fn),
  removeChangeListener: function (fn) {
    changeListeners = _.reject(changeListeners, (f) => fn == f);
  },

  getIssues: function () {
    var issues = sessionStore.fetch('issues', []);
    // console.log(issues);
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

    var issues = sessionStore.fetch('issues', []);
    console.log(_.find(issues, (i) => i.id == id));

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
