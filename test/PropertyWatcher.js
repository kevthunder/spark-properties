
const assert = require('chai').assert
const Property = require('../src/Property')
const PropertyWatcher = require('../src/watchers/PropertyWatcher')

describe('PropertyWatcher', function () {
  it('allow access to old and new value in callback function', function () {
    var call = 0
    const prop = new Property({
      default: 7
    })
    const watcher = new PropertyWatcher({
      property: prop,
      callback: function (val, old) {
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
    watcher.bind()
    prop.set(11)
    assert.equal(call, 2)
  })
  it('dont trigger recalcul for an invalidation with preventImmediate', function () {
    var call = 0
    const prop = new Property({
      calcul: function () {
        call++
        return 7
      }
    })
    const watcher = new PropertyWatcher({
      property: prop,
      callback: function (val, old) {}
    })
    watcher.bind()
    assert.equal(call, 1)
    prop.invalidate()
    assert.equal(call, 2)
    prop.invalidate({ preventImmediate: true })
    assert.equal(call, 2)
  })
  it('dont trigger watcher once unbind is called', function () {
    var call = 0
    const prop = new Property({
      default: 7
    })
    const watcher = new PropertyWatcher({
      property: prop,
      callback: function (val, old) {
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
    watcher.bind()
    prop.set(11)
    assert.equal(call, 2)
    watcher.unbind()
    prop.set(13)
    assert.equal(call, 2)
  })
  it('can copy the watcher', function () {
    const watcher = new PropertyWatcher({
      property: 'foo',
      scope: {}
    })
    const watcher2 = watcher.copyWith({
      scope: {}
    })

    assert.equal(watcher.property, watcher2.property)
    assert.notEqual(watcher.scope, watcher2.scope)
  })
  it('can tell if 2 watchers does the same thing', function () {
    const scope = {
      fooProperty: new Property({
        default: 7
      })
    }
    const callback = () => {}
    const watcher1 = new PropertyWatcher({
      property: scope.fooProperty,
      callback: callback
    })
    const watcher2 = new PropertyWatcher({
      property: 'foo',
      scope: scope,
      callback: callback
    })
    const watcher3 = new PropertyWatcher({
      property: scope.fooProperty.copyWith({}),
      callback: callback
    })
    assert.isTrue(watcher1.equals(watcher2))
    assert.isFalse(watcher1.equals(watcher3))
  })
})
