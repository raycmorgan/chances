/** @jsx React.DOM */
'use strict';

var React = require('react');
var _ = require('underscore');
var Dispatcher = require('../dispatchers/app_dispatcher');
var logger = require('../logger')('react');

// Stores
var SessionStore = require('../stores/session_store');
var IssueStore = require('../stores/issue_store');

// Components
var Auth = require('./auth');
var IssueFilterMenu = require('./issue_filter_menu');
var IssueList = require('./issue_list');

// Constants
var WATCH_STORES = [SessionStore];

function currentState() {
  return {
    token: SessionStore.getToken(),
    isValidatingToken: SessionStore.isValidatingToken(),
    isTokenValid: SessionStore.isTokenValid(),
  };
}

module.exports = React.createClass({
  getInitialState: function () {
    return currentState();
  },

  watchedStoreDidUpdate: function () {
    this.setState(currentState());
  },

  componentDidMount: function () {
    _.each(WATCH_STORES, (store) => store.addChangeListener(this.watchedStoreDidUpdate));
  },

  componentWillUnmount: function () {
    _.each(WATCH_STORES, (store) => store.removeChangeListener(this.watchedStoreDidUpdate));
  },

  handleSignOut: function (e) {
    e.preventDefault();
    Dispatcher.handleViewAction('session.delete');
  },

  render: function () {
    logger.info('Rendering <App />');

    if (this.state.token) {
      if (this.state.isTokenValid) {
        return this.renderIssues();
      } else {
        return this.renderInvalidToken();
      }
    } else {
      return this.renderAuth();
    }
  },

  renderAuth: function () {
    return <div>
      <h3 className="ch-error">Chances needs to authenticate before it can be used.</h3>
      <Auth />
    </div>;
  },

  renderValidatingToken: function () {
    return <div>
      <h3>Validating token…</h3>
    </div>;
  },

  renderInvalidToken: function () {
    return <div>
      <h3>Token is invalid. Please sign out and reauth to continue.</h3>
      <p><a href="" onClick={this.handleSignOut}>Sign out of chances</a></p>
    </div>;
  },

  renderIssues: function () {
    return <div className="columns">
      <IssueFilterMenu />
      <IssueList />

      <p><a href="" onClick={this.handleSignOut}>Sign out of chances</a></p>
    </div>;
  }
});