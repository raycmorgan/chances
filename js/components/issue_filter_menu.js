/** @jsx React.DOM */
'use strict';

var React = require('react');
var _ = require('underscore');

var IssueStore = require('../stores/issue_store');

var LabelFilterMenu = require('./label_filter_menu');

module.exports = React.createClass({
  getInitialState: function () {
    return {
      includePullRequests: IssueStore.includePullRequests()
    };
  },

  componentDidMount: function () {
    IssueStore.addChangeListener(function () {
      this.setState({
        includePullRequests: IssueStore.includePullRequests()
      });
    }.bind(this));
  },

  handleIncludePRChange: function (e) {
    e.preventDefault();
    IssueStore.setIncludePullRequests(!this.state.includePullRequests);
  },

  render: function () {
    var ipr = this.state.includePullRequests ? 'ch-selected ch-white' : '';
    ipr += ' type-icon octicon ch-selectable octicon-git-pull-request ch-no-underline';

    return <ul className="ch-menu">
      <li><a className={ipr} href="" onClick={this.handleIncludePRChange}></a></li>
      <li><LabelFilterMenu /></li>
    </ul>;
  }
});
