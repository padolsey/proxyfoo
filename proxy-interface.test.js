var vows = require('vows'),
    assert = require('assert'),
    ProxyInterface = require('./proxy-interface');

var fn = function(){};
var arr = [1,2,3];
var obj = {
  a: 123,
  b: 456,
  c: 789,
  fn: fn,
  arr: arr
};

function isEqualToObj(foo) {
  assert.strictEqual(obj.a, foo.a);
  assert.strictEqual(obj.b, foo.b);
  assert.strictEqual(obj.c, foo.c);
  assert.strictEqual(obj.fn, foo.fn);
  assert.strictEqual(obj.arr, foo.arr);
}

vows.describe('ProxyInterface').addBatch({
  'Basic definition': {
    topic: new ProxyInterface(obj).give(),
    'obj unharmed': function() {
      assert.strictEqual(obj.a, 123);
      assert.strictEqual(obj.b, 456);
      assert.strictEqual(obj.c, 789);
      assert.strictEqual(obj.fn, fn);
      assert.strictEqual(obj.arr, arr);
    },
    '!== obj': function(foo) {
      assert.notStrictEqual(foo, obj);
    },
    'isEqualToObj': isEqualToObj,
    'cannot access ProxyInterface method': function(foo) {
      assert.isUndefined(foo.get);
      assert.isUndefined(foo.has);
      assert.isUndefined(foo.finish);
    }
  },
  'Lock with key': {
    topic: new ProxyInterface(obj).lock('_spy_'),
    '_spy_ accessible': function(foo) {
      assert.isTrue('_spy_' in foo);
    },
    'correct obj': function(foo) {
      assert.isFalse(foo instanceof ProxyInterface);
    },
    'Locking [with null] results in no-access': function(foo) {
      assert.isFalse('_spy_' in foo._spy_.lock());
    }
  },
  'Define & give': {
    topic: new ProxyInterface(obj).define(/the(.+)/, {get:function(name) {
      return name;
    }}).give(),
    'isEqualToObj': isEqualToObj,
    'has custom properties': function(foo) {
      assert.equal(foo.theThing, 'Thing');
      assert.equal(foo.theProxyInterface, 'ProxyInterface');
      assert.equal(foo.the123, '123');
      assert.equal(foo.thebcdef, 'bcdef');
    }
  },
  'Define & lock [with key]': {
    topic: new ProxyInterface(obj).define(/the(.+)/, {get:function(name) {
      return name;
    }}).lock('_abc_'),
    'isEqualToObj': isEqualToObj,
    'has custom properties': function(foo) {
      assert.equal(foo.theThing, 'Thing');
      assert.equal(foo.theProxyInterface, 'ProxyInterface');
      assert.equal(foo.the123, '123');
      assert.equal(foo.thebcdef, 'bcdef');
    },
    'can lock and prevent access': function(foo) {
      assert.isTrue('_abc_' in foo);
      foo._abc_.lock();
      assert.isFalse('_abc_' in foo);
    }
  },
  'Define & lock [without key]': {
    topic: new ProxyInterface(obj).define(/the(.+)/, {get:function(name) {
      return name;
    }}).lock(),
    'isEqualToObj': isEqualToObj,
    'has custom properties': function(foo) {
      assert.equal(foo.theBlah, 'Blah');
    },
    'not regular foo': function(foo) {
      assert.isFalse('define' in foo);
    }
  },
  'Define with regular string': {
    topic: new ProxyInterface(obj).define('thingy', {get: function() {
      return 123456;
    }}).give(),
    'isEqualToObj': isEqualToObj,
    'can access thingy': function(foo) {
      assert.equal(foo.thingy, 123456);
    }
  },
  'Getter and setter': {
    topic: new ProxyInterface(obj),
    'can delete thingy': function(foo) {
      var s = function() {},
          g = function() {};
      foo.define('thingy', s, g);
      assert.equal(foo._accessors[0].get, g);
      assert.equal(foo._accessors[0].set, s);
    }
  },
  'Catch-all': {
    topic: new ProxyInterface(obj).catchAll({
      get: function() { return 123; }
    }).give(),
    'Catches all': function(foo) {
      assert.equal(foo.x, 123);
      assert.equal(foo.a, 123);
      assert.equal(foo.fn, 123);
      assert.equal(foo.arr, 123);
    }
  }
}).run();
