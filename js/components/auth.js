/** @jsx React.DOM */
'use strict';

var React = require('react');
var _ = require('underscore');
var Dispatcher = require('../dispatchers/app_dispatcher');

// Stores
var AuthenticationStore = require('../stores/authentication_store');

module.exports = React.createClass({
  getInitialState: function () {
    return {value: ''};
  },

  onChange: function (e) {
    e.preventDefault();
    this.setState({value: e.target.value});
  },

  onSubmit: function (e) {
    e.preventDefault();
    Dispatcher.handleViewAction('authenticate', this.state.value);
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
