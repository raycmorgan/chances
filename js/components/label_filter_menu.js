/** @jsx React.DOM */
'use strict';

var React = require('react');
var _ = require('underscore');

// Stores
var LabelStore = require('../stores/label_store');

// Components
var IssueListItem = require('./issue_list_item');

module.exports = React.createClass({
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

  renderTag: function (label) {
    var className = LabelStore.isLabelSelected(label.name) ? 'ch-selected' : '';

    return <li className={className} key={label.name}>
      <a href="" onClick={this.handleLabelClick} id={label.name}>{label.name}</a>
    </li>;
  },

  renderTagGroup: function (labels) {
    return <div>
      <h5>Tags</h5>
      <ul>
        {_.map(labels, this.renderTag)}
      </ul>
    </div>;
  },

  render: function () {
    return <div>
      {_.map(this.state.labelGroups, this.renderLabelGroup)}
      {this.renderTagGroup(this.state.tags)}
    </div>;
  }
});