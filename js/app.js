/** @jsx React.DOM */
'use strict';

var React = require('react');
var $ = require('jquery');
var _ = require('underscore');
var reqwest = require('reqwest');
var helpers = require('./helpers');
var Github = require('./github');
var AuthenticationStore = require('./stores/authentication_store');
var IssueStore = require('./stores/issue_store');
var LabelStore = require('./stores/label_store');

$('#issues_list').before('<div id="ch-menu" />');

var AuthView = React.createClass({
  getInitialState: function () {
    return {value: ''};
  },

  onChange: function (e) {
    e.preventDefault();
    this.setState({value: e.target.value});
  },

  onSubmit: function (e) {
    e.preventDefault();
    AuthenticationStore.setToken(this.state.value);
  },

  render: function () {
    return <form onSubmit={this.onSubmit}>
      <a href="https://github.com/settings/tokens/new?description=Local%20Chances%20Token" target="_blank">
        Generate a token with `repo` permissions 
      </a> and put that token here <small>(note that this token is <b>only</b> stored locally)</small>: 
      <input type="text" value={this.state.value} onChange={this.onChange} />
      <button type="submit">Go time!</button>
    </form>;
  }
});

var IssueListItem = React.createClass({
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
  },
});

var IssueList = React.createClass({
  renderListItem: function (issue) {
    return <IssueListItem key={issue.id} issue={issue} selected={IssueStore.isIssueSelected(issue.id)} />
  },

  render: function () {
    return <ul className="list-group issue-list-group">
      {_.map(this.props.issues, this.renderListItem)}
    </ul>;
  }
});

var LabelFilterMenu = React.createClass({
  getInitialState: function () {
    return {
      labelGroups: LabelStore.getGroupedLabels(),
      tags: LabelStore.getNonGroupedLabels()
    };
  },

  componentDidMount: function () {
    LabelStore.addChangeListener(function () {
      this.setState({
        labelGroups: LabelStore.getGroupedLabels(),
        tags: LabelStore.getNonGroupedLabels()
      });
    }.bind(this));
  },

  handleLabelClick: function (e) {
    e.preventDefault();
    var name = e.target.id;
    var selected = !LabelStore.isLabelSelected(name);

    if (selected) {
      LabelStore.selectLabel(name);
    } else {
      LabelStore.deselectLabel(name);
    }
  },

  renderGroupedLabel: function (label) {
    var name = _.rest(label.name.split(':')).join(':');
    var className = LabelStore.isLabelSelected(label.name) ? 'ch-selected' : '';
    return <li className={className} key={name}><a href="" onClick={this.handleLabelClick} id={label.name}>{name}</a></li>;
  },

  renderLabelGroup: function (labels, name) {
    return <div>
      <h5>{name}</h5>
      <ul className="ch-label-group">
        {_.map(labels, this.renderGroupedLabel)}
      </ul>
    </div>;
  },

  render: function () {
    return <div>
      {_.map(this.state.labelGroups, this.renderLabelGroup)}
    </div>;
  }
});

var IssueFilterMenu = React.createClass({
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
    console.log(this.state.includePullRequests);
    var ipr = this.state.includePullRequests ? 'ch-selected ch-white' : '';
    ipr += ' type-icon octicon ch-selectable octicon-git-pull-request ch-no-underline';

    return <ul className="ch-menu">
      <li><a className={ipr} href="" onClick={this.handleIncludePRChange}></a></li>
      <li><LabelFilterMenu /></li>
    </ul>;
  }
});

var App = React.createClass({
  watchStores: [AuthenticationStore, IssueStore],

  getInitialState: function () {
    return this.currentState();
  },

  refreshState: function () {
    this.setState(this.currentState());
  },

  currentState: function () {
    return {
      token: AuthenticationStore.getToken(),
      isValidatingToken: AuthenticationStore.isValidatingToken(),
      isTokenValid: AuthenticationStore.isTokenValid(),
      issues: IssueStore.getIssues()
    };
  },

  componentDidMount: function () {
    _.each(this.watchStores, (store) => store.addChangeListener(this.refreshState));
  },

  componentWillUnmount: function () {
    _.each(this.watchStores, (store) => store.removeChangeListener(this.refreshState));
  },

  handleSignOut: function (e) {
    e.preventDefault();
    AuthenticationStore.setToken(null);
  },

  render: function () {
    if (this.state.token) {
      if (this.state.isValidatingToken) {
        return <div>
          <h3>Validating token…</h3>
        </div>;
      } else {
        if (this.state.isTokenValid) {
          return <div>
            <IssueFilterMenu />
            <IssueList issues={this.state.issues} />
            
            <p><a href="" onClick={this.handleSignOut}>Sign out of chances</a></p>
          </div>;
        } else {
          return <div>
            <h3>Token is invalid. Please sign out and reauth to continue.</h3>
            <p><a href="" onClick={this.handleSignOut}>Sign out of chances</a></p>
          </div>;
        }
      }
    } else {
      return <div>
        <h3 className="ch-error">Chances needs to authenticate before it can be used.</h3>
        <AuthView />
      </div>;
    }
  }
});

if (document.getElementById('ch-menu')) {
  React.renderComponent(<App />, document.getElementById('ch-menu'));
}
