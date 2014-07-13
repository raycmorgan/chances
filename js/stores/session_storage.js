var logger = require('../logger')('session');

module.exports = function (storeKey) {
  var _cache = null;

  function getSessionStore() {
    if (!_cache) {
      var s = sessionStorage[storeKey];
      _cache = s ? JSON.parse(s) : {};
    }
    
    return _cache
  }

  function setSessionStore(obj) {
    _cache = null; // invalidate cache
    logger.info('Updating session store %s: ', storeKey, obj);
    sessionStorage[storeKey] = JSON.stringify(obj);
  }

  return  {
    fetch: function (k, defaultValue) {
      var ss = getSessionStore();
      var val = ss[k];
      return val === undefined ? defaultValue : val;
    },

    update: function (key, fn, defaultValue) {
      var ss = getSessionStore();
      var val = ss[key] || defaultValue;
      ss[key] = fn(val);
      setSessionStore(ss);
    }
  };
};

