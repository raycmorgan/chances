/** @jsx React.DOM */
'use strict';

var React = require('react');
var _ = require('underscore');

// Stores
var AuthenticationStore = require('../stores/authentication_store');
var IssueStore = require('../stores/issue_store');

// Components
var Auth = require('./auth');
var IssueFilterMenu = require('./issue_filter_menu');
var IssueList = require('./issue_list');

// Constants
var WATCH_STORES = [AuthenticationStore, IssueStore];

module.exports = React.createClass({
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
    _.each(WATCH_STORES, (store) => store.addChangeListener(this.refreshState));
  },

  componentWillUnmount: function () {
    _.each(WATCH_STORES, (store) => store.removeChangeListener(this.refreshState));
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
        <Auth />
      </div>;
    }
  }
});