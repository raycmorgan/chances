/** @jsx React.DOM */
'use strict';

var issueList = document.getElementById('issues_list');

// We always load the SessionStore since it is responsible
// for logging the user out on every page.
var SessionStore = require('./stores/session_store');

if (issueList) {
  OAuth.initialize('rRW8z4osjyMGc2rtUmJJm0U1qso');

  var React = require('react');
  
  var IssueStore = require('./stores/issue_store');
  var LabelStore = require('./stores/label_store');

  var App = require('./components/app');
  var container = document.createElement('div');

  container.id = 'ch-menu';
  issueList.parentNode.insertBefore(container, issueList);

  React.renderComponent(<App />, container);
}
