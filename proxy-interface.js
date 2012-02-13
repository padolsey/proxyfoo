/**
 * ProxyInterface is a generic wrapper for ESHarmony Proxies
 * Details of proxies: http://wiki.ecmascript.org/doku.php?id=harmony:proxies
 * [STILL IN DEVELOPMENT]
 */

var toString = {}.toString,
    util = require('util'),
    events = require('events');

var Foo = module.exports = function Foo(obj) {

  var me = this;

  this._handler = defaultHandler(obj);
  this._obj = obj;
  this._accessors = [];
  this._catchAll = {};

  this._handler.get = function(rec, name) {
    return me._get(name);
  };

  this._handler.set = function(rec, name, val) {
    return me._set(name, val);
  };

  this._handler.has = function(name) {
    return me._has(name);
  };

  this._handler.delete = function(name) {
    return me._delete(name);
  };

  this._proxy = Proxy.create(this._handler);

};

util.inherits(Foo, events.EventEmitter);

Foo.prototype = {
  _get: function(name) {

    if (name === this._accessPoint) {
      return this;
    }

    if (this._catchAll.get) {
      return this._catchAll.get(name);
    }

    for (var n, m, accessors = this._accessors, i = accessors.length; i--;) {
      n = accessors[i].name;
      if (
        typeof n == 'string' ?
          n === name :
          (m = name.match(n))
      ) {
        return accessors[i].get(m ? m[1] || m[0] : name);
      }
    }

    return this._obj[name];

  },
  _set: function(name, val) {

    if (name === this._accessPoint) {
      throw TypeError('Cannot set accessPoint of Foo proxy');
    }

    if (this._catchAll.set) {
      return this._catchAll.set(name, val);
    }

    for (var n, m, accessors = this._accessors, i = accessors.length; i--;) {
      n = accessors[i].name;
      if (
        typeof n == 'string' ?
          n === name :
          (m = name.match(n))
      ) {
        if (accessors[i].set) return accessors[i].set(m ? m[1] || m[0] : name, val);
      }
    }
    
    return this._obj[name] = val;
  },
  _has: function(name) {

    if (name === this._accessPoint) {
      return true;
    }

    return name in this._obj;

  },
  _delete: function(name) {

    if (name === this._accessPoint) {
      throw TypeError('Cannot delete accessPoint of Foo proxy');
    }

    if (this._catchAll.del) {
      return this._catchAll.del(name, val);
    }

    if (!(name in this._obj)) {
      return false;
    }

    for (var n, m, accessors = this._accessors, i = accessors.length; i--;) {
      n = accessors[i].name;
      if (
        typeof n == 'string' ?
          n === name :
          (m = name.match(n))
      ) {
        return accessors[i].del && accessors[i].del(m ? m[1] || m[0] : name);
      }
    }

    return delete this._obj[name];

  },
  lock: function(key) {
    if (key) {
      this._accessPoint = key;
    } else {
      delete this._accessPoint;
    }
    return this._proxy;
  },
  give: function() {
    return this._proxy;
  },
  define: function(name, setter, getter) {

    var isObj = toString.call(setter) === '[object Object]',
        get = isObj ? setter.get : getter,
        set = isObj ? setter.set : setter,
        del = isObj && setter.del || setter.destroy;

    if (!get) {
      throw Error('Getter not defined for: ' + name);
    }

    this._accessors.push({
      name: name,
      get: get,
      set: set,
      del: del
    });

    return this;
  },
  catchAll: function(setter, getter) {

    var isObj = toString.call(setter) === '[object Object]',
        get = isObj ? setter.get : getter,
        set = isObj ? setter.set : setter,
        del = isObj && setter.del || setter.destroy;

    if (!get) {
      throw Error('Getter not defined for catch-all');
    }

    this._catchAll = {
      get: get,
      set: set,
      del: del
    };

    return this;
  }
};

// From: https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Proxy
function defaultHandler(obj) {
  return {
    // Fundamental traps
    getOwnPropertyDescriptor: function(name) {
      var desc = Object.getOwnPropertyDescriptor(obj, name);
      // a trapping proxy's properties must always be configurable
      if (desc !== undefined) { desc.configurable = true; }
      return desc;
    },
    getPropertyDescriptor:  function(name) {
      var desc = Object.getPropertyDescriptor(obj, name); // not in ES5
      // a trapping proxy's properties must always be configurable
      if (desc !== undefined) { desc.configurable = true; }
      return desc;
    },
    getOwnPropertyNames: function() {
      return Object.getOwnPropertyNames(obj);
    },
    getPropertyNames: function() {
      return Object.getPropertyNames(obj);                // not in ES5
    },
    defineProperty: function(name, desc) {
      Object.defineProperty(obj, name, desc);
    },
    delete:       function(name) { return delete obj[name]; },   
    fix:          function() {
      if (Object.isFrozen(obj)) {
        return Object.getOwnPropertyNames(obj).map(function(name) {
          return Object.getOwnPropertyDescriptor(obj, name);
        });
      }
      // As long as obj is not frozen, the proxy won't allow itself to be fixed
      return undefined; // will cause a TypeError to be thrown
    },
   
    // derived traps
    has:          function(name) { return name in obj; },
    hasOwn:       function(name) { return Object.prototype.hasOwnProperty.call(obj, name); },
    get:          function(receiver, name) { return obj[name]; },
    set:          function(receiver, name, val) { obj[name] = val; return true; }, // bad behavior when set fails in non-strict mode
    enumerate:    function() {
      var result = [];
      for (name in obj) { result.push(name); };
      return result;
    },
    keys: function() { return Object.keys(obj) }
  };
}