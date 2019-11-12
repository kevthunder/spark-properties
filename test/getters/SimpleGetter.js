const assert = require('chai').assert
const Property = require('../../src/Property')
const PropertyWatcher = require('../../src/watchers/PropertyWatcher')

module.exports = function () {
  it('can format the output', function () {
    const prop = new Property({
      default: 2,
      output: function (val) {
        return val + '$'
      }
    })
    return assert.equal(prop.get(), '2$')
  })

  it('should flag as manual setted properties', function () {
    const prop = new Property()
    prop.set(2)
    return assert.equal(prop.manual, true)
  })

  it('should emit event when value change', function () {
    var call = 0
    const prop = new Property({
      default: 1
    })
    prop.events.on('updated', function () {
      return call++
    })
    assert.equal(call, 0)
    prop.get()
    assert.equal(call, 1)
    prop.set(2)
    assert.equal(call, 2)
    prop.set(2)
    assert.equal(call, 2)
    prop.set(4)
    return assert.equal(call, 3)
  })

  it('should emit event when it is invalidated', function () {
    var call = 0
    const prop = new Property({
      default: 1
    })
    prop.events.on('invalidated', function (context) {
      assert.equal(context.origin, prop)
      return call++
    })
    prop.get()
    assert.equal(call, 0)
    prop.invalidate()
    assert.equal(call, 1)
  })

  it('allow access to old and new value in change function', function () {
    var call = 0
    const prop = new Property({
      default: 7,
      change: function (val, old) {
        if (call === 0) {
          assert.equal(val, 7)
          assert.isUndefined(old)
        } else {
          assert.equal(val, 11)
          assert.equal(old, 7)
        }
        call++
      }
    })
    prop.set(11)
    assert.equal(call, 2)
  })
  it('allow the change option to be a watcher', function () {
    var call = 0
    const scope = {}
    const prop = new Property({
      default: 7,
      change: new PropertyWatcher({
        callback: function (val, old) {
          assert.equal(this, scope)
          if (call === 0) {
            assert.equal(val, 7)
            assert.isUndefined(old)
          } else {
            assert.equal(val, 11)
            assert.equal(old, 7)
          }
          call++
        }
      }),
      scope: scope
    })
    prop.set(11)
    assert.equal(call, 2)
  })
  it('should allow to alter the input value', function () {
    var prop
    prop = new Property({
      ingest: function (val) {
        if (val === 2) {
          return 'two'
        } else {
          return val
        }
      }
    })
    prop.set(2)
    assert.equal(prop.value, 'two')
    prop.set('zero')
    return assert.equal(prop.value, 'zero')
  })
  it('can call the destroy function of an object', function () {
    const prop = new Property({
      default: {
        destroy: function () {
          this.destroyed = true
        }
      },
      destroy: true
    })
    const val = prop.get()
    assert.notExists(val.destroyed)
    prop.destroy()
    return assert.isTrue(val.destroyed)
  })
  it('can call a custom destroy function', function () {
    var prop, val
    val = null
    prop = new Property({
      default: {},
      destroy: function (val) {
        val.destroyed = true
      }
    })
    val = prop.get()
    assert.notExists(val.destroyed)
    prop.destroy()
    return assert.isTrue(val.destroyed)
  })
  it('can create Getter and Setters on Scope', function () {
    const scope = {}
    const prop = new Property({
      default: 4,
      name: 'test',
      scope: scope
    })
    prop.createScopeGetterSetters()
    assert.equal(scope.test, 4)
    assert.equal(scope.testProperty.get(), 4)
    scope.test = 5
    assert.equal(scope.test, 5)
    assert.equal(scope.testProperty.get(), 5)
  })
}
