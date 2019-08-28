
const assert = require('chai').assert
const Property = require('../src/Property')

describe('BasicProperty', function () {
  it('should flag as manual setted properties', function () {
    const prop = new Property()
    prop.set(2)
    return assert.equal(prop.manual, true)
  })
  it('can invalidate a property that has a get function', function () {
    const prop = new Property({
      get: function () {
        return 3
      }
    })
    assert.isUndefined(prop.value)
    assert.equal(prop.calculated, false)
    const res = prop.get()
    assert.equal(res, 3)
    assert.equal(prop.calculated, true)
    prop.invalidate()
    assert.equal(prop.calculated, false)
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
  return it('can call a custom destroy function', function () {
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
})
