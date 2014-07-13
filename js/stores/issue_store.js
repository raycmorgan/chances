/** @jsx React.DOM */
'use strict';

var Dispatcher = require('../dispatchers/app_dispatcher');
var Github = require('../github');
var SessionStore = require('./session_store');
var LabelStore = require('./label_store');
var helpers = require('../helpers');
var _ = require('underscore');
var query = require('../query');
var sessionStorage = require('./session_storage')('IssueStorage.' + helpers.repoTuple());

var changeListeners = [];

var defaultFilters = {
  includePullRequests: false
};

// This is TERRIBAD. Need to move to a dispatcher/event model
// and only change when labels are selected, etc.
LabelStore.addChangeListener(emitChange);

function syncIssues() {
  var issues = [];

  var stream = Github(SessionStore.getToken())
                .repos(helpers.repoTuple())
                .issues
                .stream();

  stream.on('data', (issue) => issues.push(issue));
  stream.on('endChunk', function () {
    sessionStorage.update('issues', function () {
      return issues;
    });

    emitChange();
  });
  stream.on('cancelled', emitChange);
}

function emitChange() {
  _.each(changeListeners, fn => fn());
}

function currentQuery() {
  var q = {
    '$and': []
  };
  var filters = sessionStorage.fetch('filters', defaultFilters);

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


// -- Event Handling

var handlers = {
  'token.valid': function (action) {
    Dispatcher.waitFor([
      SessionStore.getDispatchID()
    ], function () {
      if (SessionStore.isTokenValid()) {
        syncIssues();
      }
    });
  }
}

var dispatchID = Dispatcher.register(function (event) {
  if (typeof handlers[event.type] === 'function') {
    handlers[event.type](event.action);
  }

  return true;
});

// --

module.exports = {
  getDispatchID: () => dispatchID,

  addChangeListener: (fn) => changeListeners.push(fn),
  removeChangeListener: function (fn) {
    changeListeners = _.reject(changeListeners, (f) => fn == f);
  },

  getIssues: function () {
    var issues = sessionStorage.fetch('issues', []);
    // console.log(issues);
    return query.filter(issues, currentQuery());
  },

  selectedIssues: function () {
    var issues = this.getIssues();
    var ids = _.map(issues, (i) => i.id);
    return _.filter(ids, this.isIssueSelected);
  },

  //

  setIncludePullRequests: function (v) {
    sessionStorage.update('filters', function (filters) {
      filters['includePullRequests'] = v;
      return filters;
    }, defaultFilters);

    emitChange();
  },

  includePullRequests: function () {
    return sessionStorage.fetch('filters', defaultFilters)['includePullRequests'];
  },

  //

  selectIssue: function (id) {
    sessionStorage.update('selected', function (selected) {
      selected[id] = true;
      return selected;
    }, {});

    var issues = sessionStorage.fetch('issues', []);
    console.log(_.find(issues, (i) => i.id == id));

    emitChange();
  },

  unselectIssue: function (id) {
    sessionStorage.update('selected', function (selected) {
      delete selected[id];
      return selected;
    }, {});
    
    emitChange();
  },

  isIssueSelected: function (id) {
    return sessionStorage.fetch('selected', {})[id] === true;
  }
};
