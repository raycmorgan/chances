/** @jsx React.DOM */
'use strict';

var React = require('react');
var _ = require('underscore');
var logger = require('../logger')('react');

// Stores
var LabelStore = require('../stores/label_store');

// Components
var LableFilterItem = require('./label_filter_item');

function currentState() {
  return {
    labelGroups: LabelStore.getGroupedLabels(),
    tags: LabelStore.getNonGroupedLabels(),
    selected: LabelStore.selectedLabels()
  };
}

module.exports = React.createClass({
  getInitialState: function () {
    return currentState();
  },

  labelStoreDidUpdate: function () {
    this.setState(currentState());
  },

  componentDidMount: function () {
    LabelStore.addChangeListener(this.labelStoreDidUpdate);
  },

  componentWillUnmount: function () {
    LabelStore.removeChangeListener(this.labelStoreDidUpdate);
  },

  renderLabel: function (label) {
    var selected = _.contains(this.state.selected, label.name);
    return <LableFilterItem label={label} selected={selected} />
  },

  renderLabelGroup: function (labels, name) {
    return <div>
      <h5>{name}</h5>
      <ul className="ch-label-group js-color-label-list filter-list color-label-list small">
        {_.map(labels, this.renderLabel)}
      </ul>
    </div>;
  },

  renderTagGroup: function (labels) {
    return <div>
      <h5>Tags</h5>
      <ul className="js-color-label-list filter-list color-label-list small">
        {_.map(labels, this.renderLabel)}
      </ul>
    </div>;
  },

  render: function () {
    logger.info('Rendering <LabelFilterMenu />');

    return <div>
      {_.map(this.state.labelGroups, this.renderLabelGroup)}
      {this.renderTagGroup(this.state.tags)}
    </div>;
  }
});
