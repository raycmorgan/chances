/** @jsx React.DOM */
'use strict';

alert('hi')

var React = require('react');
var $ = require('jquery');
var _ = require('underscore');
var reqwest = require('reqwest');
var helpers = require('./helpers');
var Github = require('./github');
var AuthenticationStore = require('./stores/authentication_store');

$('#issues_list').before('<div id="ch-menu" />');

var IssueStore = (function () {
  var issues = [];
  var changeListeners = [];

  AuthenticationStore.addChangeListener(function () {
    if (AuthenticationStore.isTokenValid) {
      syncIssues();
    }
  });

  function syncIssues() {
    issues = [];

    var stream = Github(AuthenticationStore.getToken)
                  .repos(helpers.repoTuple())
                  .issues
                  .stream();

    stream.on('data', (issue) => issues.push(issue));
    stream.on('endChunk', emitChange);
    stream.on('end', emitChange);
  }

  function emitChange() {
    _.each(changeListeners, fn => fn());
  }

  return {
    addChangeListener: (fn) => changeListeners.push(fn),
    removeChangeListener: function (fn) {
      changeListeners = _.reject(changeListeners, (f) => fn == f);
    },

    getIssues: function () {
      return _.filter(issues, (i) => !i['pull_request']);
    }
  }
}());


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
    return this.props.issue['updated_at'] != nextProps.issue['updated_at'];
  },

  renderLabel: function (label) {
    var className = "label labelstyle-" + label.color + " lighter";
    return <span key={label.name} className={className}>{label.name}</span>;
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

    console.log(issue);

    return <li className="list-group-item issue-list-item">
      <h4 className="list-group-item-name">
        <span className={iconClass}></span>
        <a href={issue['html_url']}>{issue.title}</a>
        <span className="labels">{_.map(issue.labels, this.renderLabel)}</span>
      </h4>
      {issue.state}
    </li>;
  },
});

var IssueList = React.createClass({
  renderListItem: function (issue) {
    return <IssueListItem key={issue.id} issue={issue} />
  },

  render: function () {
    return <ul className="list-group issue-list-group">
      {_.map(this.props.issues, this.renderListItem)}
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
            <h3>You are authenticated!</h3>
            <p><a href="" onClick={this.handleSignOut}>Sign out of chances</a></p>
            <IssueList issues={this.state.issues} />
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
