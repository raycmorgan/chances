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
    pages: IssueStore.pages(),
    currentPage: IssueStore.currentPage(),
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

    return (
      !arrayEqual(nextIds, currIds) ||
      !arrayEqual(nextState.selected, this.state.selected) ||
      nextState.pages.length != this.state.pages.length
    );
  },

  handlePageClick: function (page, e) {
    e.preventDefault();
    IssueStore.selectPage(page);
  },

  renderListItem: function (issue) {
    return <IssueListItem key={issue.id} issue={issue}
                     selected={_.contains(this.state.selected, issue.id)} />
  },

  renderPage: function (page) {
    if (page == this.state.currentPage) {
      return <span key={page} className="current">{page}</span>;
    } else {
      var handler = this.handlePageClick.bind(this, page);
      return <a key={page} onClick={handler}>{page}</a>;
    }
  },

  render: function () {
    logger.info('Rendering <IssueList />');

    return <div className="column three-fourths">
      <ul className="list-group issue-list-group">
        {_.map(this.state.issues, this.renderListItem)}
      </ul>

      <div className="right">
        <div className="pagination">
          {_.map(this.state.pages, this.renderPage)}
        </div>
      </div>
    </div>;
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
