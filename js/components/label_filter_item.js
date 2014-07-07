/** @jsx React.DOM */
'use strict';

var React = require('react');
var _ = require('underscore');
var logger = require('../logger')('react');

var LabelStore = require('../stores/label_store');

module.exports = React.createClass({
  handleLabelClick: function (e) {
    e.preventDefault();
    var name = this.props.label.name;
    var selected = !LabelStore.isLabelSelected(name);

    if (selected) {
      LabelStore.selectLabel(name);
    } else {
      LabelStore.deselectLabel(name);
    }
  },

  render: function () {
    var label = this.props.label;
    var selected = this.props.selected;

    if (label.name.indexOf(':') === -1) {
      var name = label.name;
    } else {
      var name = _.rest(label.name.split(':')).join(':');
    }

    var aClass = 'filter-item color-label labelstyle-' + label.color;

    if (selected) {
      aClass += ' selected';
    }
    
    var colorStyle = {backgroundColor: '#' + label.color};

    return <li onClick={this.handleLabelClick}>
      <a className={aClass}>
        <span className="color" style={colorStyle}> </span>
        <span className="name">{name}</span>
      </a>
    </li>;
  }
});