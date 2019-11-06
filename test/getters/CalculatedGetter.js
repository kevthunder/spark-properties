
const assert = require('chai').assert
const Property = require('../../src/Property')

module.exports = function () {
  it('should flag as not-manual calculated properties', function () {
    var prop, res
    prop = new Property({
      calcul: function () {
        return 3
      }
    })
    res = prop.get()
    assert.equal(res, 3)
    return assert.equal(prop.manual, false)
  })
  it('should not call calcul when using set', function () {
    var calls, prop, res
    calls = 0
    prop = new Property({
      calcul: function () {
        calls += 1
        return 3
      }
    })
    assert.isUndefined(prop.value)
    assert.equal(prop.getter.calculated, false)
    prop.set(2)
    assert.equal(prop.value, 2)
    assert.equal(calls, 0)
    assert.equal(prop.getter.calculated, true)
    res = prop.get()
    assert.equal(res, 2)
    assert.equal(prop.value, 2)
    assert.equal(calls, 0)
    return assert.equal(prop.getter.calculated, true)
  })
  it('can invalidate a property', function () {
    var prop
    prop = new Property({
      calcul: function () {
        return 3
      }
    })
    assert.isUndefined(prop.value)
    assert.equal(prop.getter.calculated, false)
    prop.get()
    assert.equal(prop.value, 3)
    assert.equal(prop.getter.calculated, true)
    prop.invalidate()
    assert.equal(prop.value, 3)
    return assert.equal(prop.getter.calculated, false)
  })
  it('should re-calcul only on the next get after an invalidation', function () {
    var callcount, prop
    callcount = 0
    prop = new Property({
      calcul: function () {
        callcount += 1
        return 3
      }
    })
    assert.equal(callcount, 0)
    assert.isUndefined(prop.value)
    assert.equal(prop.getter.calculated, false)
    prop.get()
    assert.equal(callcount, 1)
    assert.equal(prop.value, 3)
    assert.equal(prop.getter.calculated, true)
    prop.invalidate()
    assert.equal(callcount, 1)
    assert.equal(prop.value, 3)
    assert.equal(prop.getter.calculated, false)
    prop.get()
    assert.equal(callcount, 2)
    assert.equal(prop.value, 3)
    return assert.equal(prop.getter.calculated, true)
  })
  it('should re-calcul immediately if the change option is defined', function () {
    var calculCalls, changeCalls, prop, val
    calculCalls = 0
    changeCalls = 0
    val = 3
    prop = new Property({
      calcul: function () {
        calculCalls += 1
        return val
      },
      change: function (val, old) {
        changeCalls += 1
      }
    })
    assert.equal(calculCalls, 1, 'nb calcul calls')
    assert.equal(changeCalls, 1, 'nb change calls')
    assert.equal(prop.value, 3)
    assert.equal(prop.getter.calculated, true)
    prop.get()
    assert.equal(calculCalls, 1, 'nb calcul calls')
    assert.equal(changeCalls, 1, 'nb change calls')
    assert.equal(prop.value, 3)
    assert.equal(prop.getter.calculated, true)
    prop.invalidate()
    assert.equal(calculCalls, 2, 'nb calcul calls')
    assert.equal(changeCalls, 1, 'nb change calls')
    assert.equal(prop.value, 3)
    assert.equal(prop.getter.calculated, true)
    val = 4
    prop.invalidate()
    assert.equal(calculCalls, 3, 'nb calcul calls')
    assert.equal(changeCalls, 2, 'nb change calls')
    assert.equal(prop.value, 4)
    assert.equal(prop.getter.calculated, true)
    prop.get()
    assert.equal(calculCalls, 3, 'nb calcul calls')
    assert.equal(changeCalls, 2, 'nb change calls')
    assert.equal(prop.value, 4)
    return assert.equal(prop.getter.calculated, true)
  })
}
