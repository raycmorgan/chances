var _ = require('underscore');

var loggers = {};
var levels = ['log', 'info', 'warn', 'error'];

if (process.env.NODE_ENV !== 'production') {
  module.exports = function (loggerName) {
    if (loggers[loggerName]) {
      return loggers[loggerName];
    }

    var logger = loggers[loggerName] = {};

    _.each(levels, function (level) {
      logger[level] = function (firstArg) {
        if (typeof firstArg === 'string') {
          var initial = '[Pour Over (' + loggerName + ')] ' + firstArg;
          var rest = _.rest(arguments);
        } else {
          var initial = '[Pour Over (' + loggerName + ')]';
          var rest = _.rest(arguments, 0);
        }

        console[level].apply(console, [initial].concat(rest));
      }
    });

    return logger;
  }
} else {
  module.exports = function () {
    var noop = function () {};
    return {info: noop, warn: noop, error: noop};
  }
}
