/** @jsx React.DOM */
'use strict';

var React = require('react');
var _ = require('underscore');
var markdown = require('markdown').markdown;

// Stores
var IssueStore = require('../stores/issue_store');

module.exports = React.createClass({
  shouldComponentUpdate: function (nextProps) {
    return !(this.props.issue['updated_at'] == nextProps.issue['updated_at']
              && this.props.selected == nextProps.selected);
  },

  handleSelect: function (e) {
    if (this.props.selected) {
      IssueStore.unselectIssue(this.props.issue.id);
    } else {
      IssueStore.selectIssue(this.props.issue.id);
    }
  },

  renderLabel: function (label) {
    var className = "ch-label label labelstyle-" + label.color + " lighter";
    return <span><span key={label.name} className={className}>{label.name}</span> </span>;
  },

  render: function () {
    var issue = this.props.issue;
    var iconClass = 'type-icon octicon';

    var pullRequest = issue['pull_request'];

    if (pullRequest) {
      iconClass += ' octicon-git-pull-request';
    }

    switch (issue.state) {
      case 'open':
        iconClass += ' open';

        if (!pullRequest) {
          iconClass += ' octicon-issue-opened';
        }
        break;
      case 'closed':
        iconClass += ' open';

        if (!pullRequest) {
          iconClass += ' octicon-issue-closed';
        }
        break;
      default:
        console.warn('Unknown issue state: %s', issue.state);
    }

    // console.log(issue);

    return <li className="list-group-item issue-list-item selectable">
      <input className="list-group-item-check js-issues-list-checkbox select-toggle-check"
             type="checkbox"
             checked={this.props.selected}
             onChange={this.handleSelect} />

      <h4 className="list-group-item-name">
        <span className={iconClass}></span>
        <a href={issue['html_url']}>{issue.title}</a>
        <span className="labels">{_.map(issue.labels, this.renderLabel)}</span>
      </h4>
    </li>;

    // <div className="three-fourths" dangerouslySetInnerHTML={{__html: markdown.toHTML(issue.body)}} />
  },
});