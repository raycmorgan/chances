/** @jsx React.DOM */
'use strict';

var Github = require('../github');
var SessionStore = require('./session_store');
var helpers = require('../helpers');
var _ = require('underscore');
var sessionStorage = require('./session_storage')('LabelStorage.' + helpers.repoTuple());

var changeListeners = [];

SessionStore.addChangeListener(function () {
  if (SessionStore.isTokenValid()) {
    sync();
  }
});

function sync() {
  var labels = [];

  var stream = Github(SessionStore.getToken())
                .repos(helpers.repoTuple())
                .labels
                .stream();

  stream.on('data', (label) => labels.push(label));
  stream.on('end', function () {
    sessionStorage.update('labels', function () {
      return labels;
    });

    emitChange();
  });
}

function emitChange() {
  _.each(changeListeners, fn => fn());
}

module.exports = {
  addChangeListener: (fn) => changeListeners.push(fn),
  removeChangeListener: function (fn) {
    changeListeners = _.reject(changeListeners, (f) => fn == f);
  },

  getLabels: function () {
    return sessionStorage.fetch('labels', []);
  },

  selectedLabels: function () {
    var labels = sessionStorage.fetch('labels', []);
    var names = _.map(labels, (l) => l.name);
    return _.filter(names, this.isLabelSelected);
  },

  getGroupedLabels: function () {
    var labels = sessionStorage.fetch('labels', []);
    var isGrouped = (l) => l.name.indexOf(':') != -1

    return _.groupBy(_.filter(labels, isGrouped), function (l) {
      return l.name.split(':')[0];
    });
  },

  getNonGroupedLabels: function () {
    var labels = sessionStorage.fetch('labels', []);
    return _.filter(labels, (l) => l.name.indexOf(':') == -1);
  },

  selectLabel: function (name) {
    sessionStorage.update('selectedLabels', function (selected) {
      selected[name] = true;
      return selected;
    }, {});

    emitChange();
  },

  deselectLabel: function (name) {
    sessionStorage.update('selectedLabels', function (selected) {
      delete selected[name];
      return selected;
    }, {});

    emitChange();
  },

  isLabelSelected: function (name) {
    return sessionStorage.fetch('selectedLabels', {})[name] === true;
  },
};



// {
//   pull_request: {$exists: false},
// 
//   project: {$in: ['api', 'manage']},
//   priority: {$in: ['high']}
// }
