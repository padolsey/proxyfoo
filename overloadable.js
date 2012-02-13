/**
 * Overloadable takes a function and returns a wrapped proxy object
 * which supports overloaded methods, types being specified by a multi-line
 * comment before each argument. It's optimised for calling.
 * When overloading a method it'll map all potential type signatures
 * to the function itself, thus saving considerable time when calling.
 * ---
 * See overloadable.test.js for some examples.
 */

var ProxyInterface = require('./proxy-interface');
var REGEX_FN_ARGS = /function *[^\(]+\((?:.*\/\*.+?\*\/.*)\)/;
var REGEX_ARG_SIG = /\/\*(.+?)\*\/ *([^,]+)/gi;
var toString = {}.toString;

var typeMap = overloadable.typeMap = {
  string: 'string',
  str: 'string',
  number: 'number',
  num: 'number',
  nan: 'nan',
  array: 'array',
  arr: 'array',
  'null': 'null',
  'undefined': 'undefined',
  undef: 'undefined',
  regexp: 'regexp',
  regex: 'regex',
  object: 'object',
  obj: 'object'
};

module.exports = overloadable;

function overloadable(obj) {
  
  var pi = new ProxyInterface(obj),
      methodNameMap = {},
      methodWrappers = {};

  function toTypeSig(args) {
    return [].slice.call(args).map(function(val) {
      if (typeof val == 'string') return 'string';
      if (typeof val == 'number') {
        return isNaN(val) ? 'nan' : 'number';
      }
      if (!val) {
        return val + '';
      }
      return toString.call(val).split(' ')[1].slice(0, -1).toLowerCase();
    }).join();
  }

  // String(?:)

  pi.catchAll({
    get: function(name) {
      if (name in methodNameMap) {
        var typeMethods = methodNameMap[name];
        return methodWrappers[name] || (methodWrappers[name] = function() {
          var fn, types;
          if (fn = typeMethods[types = toTypeSig(arguments)]) {
            return fn.apply(this, arguments);
          }
          throw Error(
            name + '(): The argument signature, [' + types + '], is not supported'
          );
        });
      }
      return obj[name];
    },
    set: function(name, val) {

      //console.log('Setting', name);

      if (typeof val == 'function' && REGEX_FN_ARGS.test(val)) {

        // It's a function and has the pattern `/*TYPE*/ ARG` at least
        // once in its signature.

        var m,
            fnStrung = String(val),
            typeMethods = methodNameMap[name] || (methodNameMap[name] = {}),
            types = [];

        while (m = REGEX_ARG_SIG.exec(fnStrung)) {

          var argTypes = m[1].toLowerCase().split('|'),
              argTypesCount = argTypes.length,
              name = m[2],
              cleanTypes = types.slice().map(function(a) {
                return a.slice();
              });

          for (
            var i = 0,
                tl = types.length,
                // Total number of type signatures required
                total = tl * argTypesCount || argTypesCount;
            i < total;
            ++i
          ) {
            //console.log('>>', typeMap[argTypes[i % argTypesCount]], argTypes[i % argTypesCount])
            (
              // Copy (or make new) type-sig array from current types
              // (found in cleanTypes)
              types[i] = (cleanTypes[0 | i / (total/tl)] || []).slice()
            ).push(typeMap[argTypes[i % argTypesCount]]);//.push([argTypes[i % argTypesCount]]);
          }

        }

        //console.log(types);

        types.forEach(function(typeSig) {
          typeMethods[typeSig] = val;
        });

      }

    }
  });

  return pi.lock();

}