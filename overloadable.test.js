var vows = require('vows'),
    assert = require('assert'),
    overloadable = require('./overloadable');

vows.describe('ProxyInterface').addBatch({
  'Basic overloadable': {
    topic: overloadable({}),
    'works': function(o) {
      o.act = function(/*String*/ foo) {
        return 123;
      };
      o.act = function(/*Number*/ foo) {
        return 456;
      };
      assert.equal(o.act(1), 456);
      assert.equal(o.act(''), 123);
    }
  },
  'Multi-arg [1]': {
    topic: overloadable({}),
    'works': function(o) {
      o.act = function(/*String|Number*/ a, /*Array|Object*/ b) {
        return 'A';
      };
      o.act = function(/*Number*/ a, /*Object*/ b) {
        return 'B'; 
      };
      assert.equal(o.act(1, {}), 'B');
      assert.equal(o.act(1, []), 'A');
      assert.equal(o.act('foo', []), 'A');
      assert.equal(o.act(999, {}), 'B');
      assert.equal(o.act('bar', {}), 'A');
    }
  },
  'Types': {
    topic: overloadable({}),
    'works': function(o) {
      o.foo = function(/*String*/a) { return 1 };
      o.foo = function(/*RegExp*/a) { return 2 };
      o.foo = function(/*null*/a) { return 3 };
      o.foo = function(/*undefined*/a) { return 4 };
      o.foo = function(/*Number*/a) { return 5 };
      o.foo = function(/*Object*/a) { return 6 };
      o.foo = function(/*Array*/a) { return 7 };
      assert.equal(o.foo(''), 1);
      assert.equal(o.foo('wtf'), 1);
      assert.equal(o.foo(/(?:...)/gi), 2);
      assert.equal(o.foo(/a/), 2);
      assert.equal(o.foo(null), 3);
      assert.equal(o.foo(void 0), 4);
      assert.equal(o.foo(999), 5);
      assert.equal(o.foo(Infinity), 5);
      assert.equal(o.foo(0.2342834789), 5);
      assert.equal(o.foo({}), 6);
      assert.equal(o.foo(new function(){}), 6);
      assert.equal(o.foo([]), 7);
      assert.equal(o.foo(Array(1)), 7);
    },
    'Crazy arguments': {
      topic: overloadable({}),
      'works': function(o) {
        o.foo = function(/*Str|Num*/ a, /*Obj|Arr|Str*/ b, /*Num|NaN*/ c) {
          return 1;
        };
        o.foo = function(/*Str*/ a, /*Str*/ b, /*Num*/ c) {
          return 2;
        };
        o.foo = function(/*Str|Num*/ a, /*Obj|Arr|RegExp*/ b) {
          return 3;
        };
        o.foo = function(/*Num*/ a, /*Obj|Arr*/ b, /*NaN*/c) {
          return 4;
        };
        assert.equal(o.foo(123, []), 3);
        assert.equal(o.foo(123, [], +'a'), 4);
        assert.equal(o.foo('a', 'b', 123), 2);
        assert.equal(o.foo('a', 'b', +'a'), 1);
        assert.equal(o.foo('a', {}, 999), 1);
        assert.equal(o.foo(321, {}, +'a'), 4);
        assert.throws(function(){ o.foo() }, Error);
        assert.throws(function(){ o.foo(1,2,3) }, Error);
        assert.throws(function(){ o.foo([]) }, Error);
        assert.throws(function(){ o.foo('str') }, Error);
        assert.throws(function(){ o.foo(null) }, Error);
      }
    }
  }
}).run();
