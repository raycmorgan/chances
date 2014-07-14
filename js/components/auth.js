/** @jsx React.DOM */
'use strict';

var React = require('react');
var _ = require('underscore');
var Dispatcher = require('../dispatchers/app_dispatcher');

module.exports = React.createClass({
  handleAuthenticate: function (e) {
    e.preventDefault();

    OAuth.popup('github', function (err, result) {
      if (err) {
        alert('An OAuth error occured. Check the console for more details.');
        console.error(err);
      } else {
        Dispatcher.handleViewAction('session.create', {token: result['access_token']});
      }
    });
  },

  render: function () {
    return <a href="" onClick={this.handleAuthenticate}>Auth with Github</a>;
  }
});
