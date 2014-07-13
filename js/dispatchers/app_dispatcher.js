var merge = require('react/lib/merge');
var Dispatcher = require('./dispatcher');

var AppDispatcher = merge(Dispatcher.prototype, {

  /**
   * A bridge function between the views and the dispatcher, marking the action
   * as a view action.  Another variant here could be handleServerAction.
   * @param  {object} action The data coming from the view.
   */
  handleViewAction: function(type, action) {
    this.dispatch({
      source: 'VIEW_ACTION',
      type: type,
      action: action
    });
  },

  handleStoreAction: function(type, action) {
    this.dispatch({
      source: 'STORE_ACTION',
      type: type,
      action: action
    });
  },

});

AppDispatcher.handleViewAction = AppDispatcher.handleViewAction.bind(AppDispatcher);
AppDispatcher.handleStoreAction = AppDispatcher.handleStoreAction.bind(AppDispatcher);

module.exports = AppDispatcher;
