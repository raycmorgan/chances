/** @jsx React.DOM */
'use strict';

var issueList = document.getElementById('issues_list');

if (issueList) {
  var React = require('react');
  
  var AuthenticationStore = require('./stores/authentication_store');
  var IssueStore = require('./stores/issue_store');
  var LabelStore = require('./stores/label_store');

  var App = require('./components/app');
  var container = document.createElement('div');

  container.id = 'ch-menu';
  issueList.parentNode.insertBefore(container, issueList);

  React.renderComponent(<App />, container);
}
