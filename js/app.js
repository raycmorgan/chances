/** @jsx React.DOM */

var React = require('react');
var $ = require('jquery');
var _ = require('underscore');
var reqwest = require('reqwest');

$('#issues_list').before('<div id="ch-menu" />');

var AuthenticationStore = (function () {
  var token = localStorage['ch-token'];
  var changeListeners = [];

  function emitChange() {
    changeListeners.forEach(fn => fn());
  }

  return {
    addChangeListener: (fn) => changeListeners.push(fn),
    removeChangeListener: function (fn) {
      changeListeners = _.reject(changeListeners, (f) => fn == f);
    },

    getToken: () => token,
    setToken: function (newToken) {
      token = newToken;

      if (token) {
        localStorage['ch-token'] = newToken;
      } else {
        delete localStorage['ch-token'];
      }
      
      emitChange();
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

var App = React.createClass({
  getInitialState: function () {
    return this.currentState();
  },

  refreshState: function () {
    this.setState(this.currentState());
  },

  currentState: function () {
    return {
      token: AuthenticationStore.getToken()
    };
  },

  componentDidMount: function () {
    AuthenticationStore.addChangeListener(this.refreshState);
  },

  componentWillUnmount: function () {
    AuthenticationStore.removeChangeListener(this.refreshState);
  },

  handleSignOut: function (e) {
    e.preventDefault();
    AuthenticationStore.setToken(null);
  },

  render: function () {
    if (this.state.token) {
      reqwest({
        url: 'https://api.github.com/issues',
        method: 'get',
        data: {'access_token': this.state.token},
        crossOrigin: true,
        success: function (resp) {
          console.log(resp);
        },
        error: function (err) {
          console.error(err);
        }
      });

      return <div>
        <h3>You are authenticated!</h3>
        <p><a href="" onClick={this.handleSignOut}>Sign out of chances</a></p>
      </div>;
    } else {
      return <div>
        <h3 className="ch-error">Chances needs to authenticate before it can be used.</h3>
        <AuthView />
      </div>;
    }
  }
});

React.renderComponent(<App />, document.getElementById('ch-menu'));

$('#issues_list').css({'margin-top': 50});
