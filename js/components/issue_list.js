/** @jsx React.DOM */
'use strict';

var React = require('react');
var _ = require('underscore');
var logger = require('../logger')('react');

// Stores
var IssueStore = require('../stores/issue_store');

// Components
var IssueListItem = require('./issue_list_item');

function currentState() {
  return {
    issues: IssueStore.getIssues(),
    selected: IssueStore.selectedIssues(),
  };
}

module.exports = React.createClass({
  getInitialState: function () {
    return currentState();
  },

  issueStoreDidUpdate: function () {
    this.setState(currentState());
  },

  componentDidMount: function () {
    IssueStore.addChangeListener(this.issueStoreDidUpdate);
  },

  componentWillUnmount: function () {
    IssueStore.removeChangeListener(this.issueStoreDidUpdate);
  },

  shouldComponentUpdate: function (nextProps, nextState) {
    var nextIds = _.map(nextState.issues, (i) => i.id);
    var currIds = _.map(this.state.issues, (i) => i.id);

    return !(
      arrayEqual(nextIds, currIds) &&
      arrayEqual(nextState.selected, this.state.selected)
    );
  },

  renderListItem: function (issue) {
    return <IssueListItem key={issue.id} issue={issue}
                     selected={_.contains(this.state.selected, issue.id)} />
  },

  render: function () {
    logger.info('Rendering <IssueList />');

    return <ul className="list-group issue-list-group column three-fourths">
      {_.map(this.state.issues, this.renderListItem)}
    </ul>;
  }
});

function arrayEqual(a1, a2) {
  if (a1.length !== a2.length) {
    return false;
  }

  return _.every(a1, function (el, i) {
    return el === a2[i];
  });
}
