/** @jsx React.DOM */
'use strict';

var React = require('react');
var _ = require('underscore');
var logger = require('../logger')('react');

var IssueStore = require('../stores/issue_store');

var LabelFilterMenu = require('./label_filter_menu');

module.exports = React.createClass({
  getInitialState: function () {
    return {
      includePullRequests: IssueStore.includePullRequests()
    };
  },

  issueStoreDidChange: function () {
    this.setState({
      includePullRequests: IssueStore.includePullRequests()
    });
  },

  componentDidMount: function () {
    IssueStore.addChangeListener(this.issueStoreDidChange);
  },

  componentWillUnmount: function () {
    IssueStore.removeChangeListener(this.issueStoreDidChange);
  },

  handleIncludePRChange: function (e) {
    e.preventDefault();
    IssueStore.setIncludePullRequests(!this.state.includePullRequests);
  },

  shouldComponentUpdate: function (nextProps, nextState) {
    return nextState.includePullRequests !== this.state.includePullRequests;
  },

  render: function () {
    logger.log('Rendering <IssueFilterMenu />');

    var ipr = this.state.includePullRequests ? 'ch-selected ch-white' : '';
    ipr += ' type-icon octicon ch-selectable octicon-git-pull-request ch-no-underline';

    return <ul className="ch-menu column one-fourth">
      <li><a className={ipr} href="" onClick={this.handleIncludePRChange}></a></li>
      <li><LabelFilterMenu /></li>
    </ul>;
  }
});
