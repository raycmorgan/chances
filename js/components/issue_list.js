/** @jsx React.DOM */
'use strict';

var React = require('react');
var _ = require('underscore');

// Stores
var IssueStore = require('../stores/issue_store');

// Components
var IssueListItem = require('./issue_list_item');

module.exports = React.createClass({
  renderListItem: function (issue) {
    return <IssueListItem key={issue.id} issue={issue} selected={IssueStore.isIssueSelected(issue.id)} />
  },

  render: function () {
    return <ul className="list-group issue-list-group">
      {_.map(this.props.issues, this.renderListItem)}
    </ul>;
  }
});
