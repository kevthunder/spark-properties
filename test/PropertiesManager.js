
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
  it('keeps old options when overriding a property', function () {
    let calls = 0
    const manager = new PropertiesManager({
      a: {
        change: function () {
          calls += 1
        }
      }
    })
    const manager2 = manager.copyWith({
      a: {
        default: 10
      }
    })
    manager2.initProperties()

    assert.equal(calls, 1)
    assert.equal(manager2.getProperty('a').get(), 10)
    assert.equal(calls, 1)
    manager2.getProperty('a').set(7)
    assert.equal(manager2.getProperty('a').get(), 7)
    assert.equal(calls, 2)
  })
  it('allows to call an overrided function of a property', function () {
    let callcount1 = 0
    let callcount2 = 0
    const scope = {}
    const manager = new PropertiesManager({
      a: {
        change: function () {
          callcount1 += 1
          assert.equal(this, scope)
        }
      }
    }, { scope: scope })
    const manager2 = manager.copyWith({
      a: {
        change: function (val, old, parent) {
          parent(val, old)
          callcount2 += 1
          assert.equal(this, scope)
        }
      }
    })
    manager2.initProperties()

    assert.equal(callcount1, 1, 'original callcount1')
    assert.equal(callcount2, 1, 'original callcount2')
    manager2.getProperty('a').set(7)
    assert.equal(manager2.getProperty('a').get(), 7)
    assert.equal(callcount1, 2, 'new callcount1')
    assert.equal(callcount2, 2, 'new callcount2')
  })
})
