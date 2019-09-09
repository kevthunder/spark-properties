
const assert = require('chai').assert
const PropertiesManager = require('../src/PropertiesManager')

describe('PropertiesManager', function () {
  it('can get a property by name', function () {
    const manager = new PropertiesManager({
      test: {
        default: 4
      }
    })
    manager.initProperties()
    assert.equal(manager.getProperty('test').get(), 4)
  })
  it('can define getters and setters on the scope for each property', function () {
    const scope = {}
    const manager = new PropertiesManager({
      a: {
        default: 1
      },
      b: {
        default: 2
      }
    }).useScope(scope)
    manager.initProperties()
    manager.createScopeGetterSetters()

    assert.equal(scope.a, 1)
    assert.equal(scope.b, 2)
    assert.equal(scope.aProperty.get(), 1)
    assert.equal(scope.bProperty.get(), 2)
    scope.a = 3
    scope.b = 4
    assert.equal(scope.a, 3)
    assert.equal(scope.b, 4)
  })
  it('calling destroy also trigger Properties destroy', function () {
    let call = 0
    const manager = new PropertiesManager({
      test: {
        destroy: function () {
          call++
        }
      }
    })
    manager.initProperties()
    assert.equal(call, 0)
    manager.destroy()
    assert.equal(call, 1)
  })
  it('can mass assign properties', function () {
    const manager = new PropertiesManager({
      a: {
        default: 0
      },
      b: {
        default: 0
      },
      c: {
        default: 0
      },
      d: {
        default: 0
      }
    })
    manager.initProperties()
    assert.equal(manager.getProperty('a').get(), 0)
    assert.equal(manager.getProperty('b').get(), 0)
    assert.equal(manager.getProperty('c').get(), 0)
    assert.equal(manager.getProperty('d').get(), 0)
    manager.setPropertiesData({
      a: 1,
      b: 2,
      c: 3,
      f: 8
    })
    assert.equal(manager.getProperty('a').get(), 1)
    assert.equal(manager.getProperty('b').get(), 2)
    assert.equal(manager.getProperty('c').get(), 3)
    assert.equal(manager.getProperty('d').get(), 0)
  })
  it('can get all manually setted properties', function () {
    const manager = new PropertiesManager({
      a: {
        default: 0
      },
      b: {
        default: 0
      },
      d: {
        calcul: function () {
          return 4
        }
      }
    })
    manager.initProperties()
    assert.deepEqual(manager.getManualDataProperties(), {}, 'initial')
    manager.getProperty('a').set(1)
    manager.getProperty('b').set(2)
    assert.deepEqual(manager.getManualDataProperties(), {
      a: 1,
      b: 2
    }, 'after assign')
    manager.getProperty('d').get()
    manager.getProperty('d').set(4)
    assert.deepEqual(manager.getManualDataProperties(), {
      a: 1,
      b: 2
    }, 'after cacul')
    manager.getProperty('d').set(5)
    assert.deepEqual(manager.getManualDataProperties(), {
      a: 1,
      b: 2,
      d: 5
    }, 'after assign over caculated value')
    manager.getProperty('d').invalidate()
    return assert.deepEqual(manager.getManualDataProperties(), {
      a: 1,
      b: 2
    }, 'after invalidate')
  })
  it('can mass assign properties with whitelist', function () {
    const manager = new PropertiesManager({
      a: {
        default: 0
      },
      b: {
        default: 0
      },
      c: {
        default: 0
      },
      d: {
        default: 0
      }
    })
    manager.initProperties()
    assert.equal(manager.getProperty('a').get(), 0)
    assert.equal(manager.getProperty('b').get(), 0)
    assert.equal(manager.getProperty('c').get(), 0)
    assert.equal(manager.getProperty('d').get(), 0)
    manager.setPropertiesData({
      a: 1,
      b: 2,
      c: 3
    }, {
      whitelist: ['a', 'b']
    })
    assert.equal(manager.getProperty('a').get(), 1)
    assert.equal(manager.getProperty('b').get(), 2)
    assert.equal(manager.getProperty('c').get(), 0)
    assert.equal(manager.getProperty('d').get(), 0)
  })
  it('can mass assign properties with blacklist', function () {
    const manager = new PropertiesManager({
      a: {
        default: 0
      },
      b: {
        default: 0
      },
      c: {
        default: 0
      },
      d: {
        default: 0
      }
    })
    manager.initProperties()
    assert.equal(manager.getProperty('a').get(), 0)
    assert.equal(manager.getProperty('b').get(), 0)
    assert.equal(manager.getProperty('c').get(), 0)
    assert.equal(manager.getProperty('d').get(), 0)
    manager.setPropertiesData({
      a: 1,
      b: 2,
      c: 3
    }, {
      blacklist: ['c']
    })
    assert.equal(manager.getProperty('a').get(), 1)
    assert.equal(manager.getProperty('b').get(), 2)
    assert.equal(manager.getProperty('c').get(), 0)
    assert.equal(manager.getProperty('d').get(), 0)
  })
  it.skip('keeps old options when overriding a property', function () {
    var TestClass, obj
    TestClass = (function () {
      class TestClass extends Element {
        init () {
          return this.callcount = 0
        }
      };

      TestClass.properties({
        prop: {
          change: function () {
            return this.callcount += 1
          }
        }
      })

      return TestClass
    }.call(this))
    TestClass.properties({
      prop: {
        default: 10
      }
    })
    obj = new TestClass()
    assert.equal(obj.callcount, 1)
    assert.equal(obj.prop, 10)
    assert.equal(obj.callcount, 1)
    obj.prop = 7
    assert.equal(obj.prop, 7)
    return assert.equal(obj.callcount, 2)
  })
  it.skip('allows to call an overrided function of a property', function () {
    var TestClass, obj
    TestClass = (function () {
      class TestClass extends Element {
        init () {
          this.callcount1 = 0
          this.callcount2 = 0
        }
      };

      TestClass.properties({
        prop: {
          change: function (old) {
            this.callcount1 += 1
          }
        }
      })

      return TestClass
    }.call(this))
    TestClass.properties({
      prop: {
        change: function (old, overrided) {
          this.callcount2 += 1
        }
      }
    })
    obj = new TestClass()
    assert.equal(obj.callcount1, 1)
    assert.equal(obj.callcount2, 1)
    obj.prop = 7
    assert.equal(obj.prop, 7)
    assert.equal(obj.callcount1, 2, 'original callcount')
    return assert.equal(obj.callcount2, 2, 'new callcount')
  })
})
