
const assert = require('chai').assert
const Property = require('../src/Property')
const EventEmitter = require('events')
const Invalidator = require('../src/Invalidator')

describe('Property', function () {
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
    assert.equal(prop.calculated, false)
    prop.set(2)
    assert.equal(prop.value, 2)
    assert.equal(calls, 0)
    assert.equal(prop.calculated, true)
    res = prop.get()
    assert.equal(res, 2)
    assert.equal(prop.value, 2)
    assert.equal(calls, 0)
    return assert.equal(prop.calculated, true)
  })
  it('can invalidate a property', function () {
    var prop
    prop = new Property({
      calcul: function () {
        return 3
      }
    })
    assert.isUndefined(prop.value)
    assert.equal(prop.calculated, false)
    prop.get()
    assert.equal(prop.value, 3)
    assert.equal(prop.calculated, true)
    prop.invalidate()
    assert.equal(prop.value, 3)
    return assert.equal(prop.calculated, false)
  })
  it('can invalidate a property from an event', function () {
    var emitter, prop
    emitter = {
      addListener: function (evt, listener) {
        this.event = evt
        this.listener = listener
      },
      removeListener: function (evt, listener) {
        this.event = null
        this.listener = null
      },
      emit: function () {
        if (this.listener != null) {
          return this.listener()
        }
      }
    }
    prop = new Property({
      calcul: function (invalidated) {
        invalidated.event('testChanged', emitter)
        return 3
      }
    })
    assert.notExists(emitter.event)
    assert.isUndefined(prop.value)
    assert.equal(prop.calculated, false, 'calculated initially false')
    prop.get()
    assert.exists(emitter.event)
    assert.equal(prop.value, 3)
    assert.equal(prop.calculated, true, 'calculated true after get')
    emitter.emit()
    assert.notExists(emitter.event)
    assert.equal(prop.value, 3)
    return assert.equal(prop.calculated, false, 'calculated false after invalidation')
  })
  it('can handle indirect event target for invalidators', function () {
    var Emitter, binded, prop, val
    val = 3
    binded = false
    Emitter = class Emitter {
      addListener (evt, listener) {
        binded = true
      }

      removeListener (evt, listener) {
        binded = false
      }
    }
    prop = new Property({
      calcul: function (invalidated) {
        invalidated.event('testChanged', new Emitter())
        val += 1
        return val
      },
      immediate: true
    })
    assert.equal(prop.calculated, false, 'calculated initially false')
    assert.isFalse(binded)
    prop.get()
    assert.equal(prop.calculated, true, 'calculated true after get')
    assert.isTrue(binded)
    prop.invalidate()
    assert.equal(prop.calculated, false, 'calculated false after invalidation')
    assert.isFalse(binded, 'binded should be false after invalidation')
    prop.get()
    assert.equal(prop.calculated, true, 'calculated true after get 2')
    return assert.isTrue(binded)
  })
  it('should re-calcul only on the next get after an invalidation', function () {
    var callcount, prop
    callcount = 0
    prop = new Property({
      calcul: function (invalidated) {
        callcount += 1
        return 3
      }
    })
    assert.equal(callcount, 0)
    assert.isUndefined(prop.value)
    assert.equal(prop.calculated, false)
    prop.get()
    assert.equal(callcount, 1)
    assert.equal(prop.value, 3)
    assert.equal(prop.calculated, true)
    prop.invalidate()
    assert.equal(callcount, 1)
    assert.equal(prop.value, 3)
    assert.equal(prop.calculated, false)
    prop.get()
    assert.equal(callcount, 2)
    assert.equal(prop.value, 3)
    return assert.equal(prop.calculated, true)
  })
  it('should re-calcul immediately if the change option is defined', function () {
    var calculCalls, changeCalls, prop, val
    calculCalls = 0
    changeCalls = 0
    val = 3
    prop = new Property({
      calcul: function (invalidated) {
        calculCalls += 1
        return val
      },
      change: function (old) {
        changeCalls += 1
      }
    })
    assert.equal(calculCalls, 1, 'nb calcul calls')
    assert.equal(changeCalls, 1, 'nb change calls')
    assert.equal(prop.value, 3)
    assert.equal(prop.calculated, true)
    prop.get()
    assert.equal(calculCalls, 1, 'nb calcul calls')
    assert.equal(changeCalls, 1, 'nb change calls')
    assert.equal(prop.value, 3)
    assert.equal(prop.calculated, true)
    prop.invalidate()
    assert.equal(calculCalls, 2, 'nb calcul calls')
    assert.equal(changeCalls, 1, 'nb change calls')
    assert.equal(prop.value, 3)
    assert.equal(prop.calculated, true)
    val = 4
    prop.invalidate()
    assert.equal(calculCalls, 3, 'nb calcul calls')
    assert.equal(changeCalls, 2, 'nb change calls')
    assert.equal(prop.value, 4)
    assert.equal(prop.calculated, true)
    prop.get()
    assert.equal(calculCalls, 3, 'nb calcul calls')
    assert.equal(changeCalls, 2, 'nb change calls')
    assert.equal(prop.value, 4)
    return assert.equal(prop.calculated, true)
  })
  it('keeps properties invalidators', function () {
    var emitter, prop
    emitter = new EventEmitter()
    prop = new Property({
      calcul: function (invalidated) {
        return invalidated.event('test', emitter)
      }
    })
    prop.get()
    return assert.instanceOf(prop.invalidator, Invalidator)
  })
  it.skip('allow implicit target for invalidators', function () {
    var prop, res
    prop = new Property({
      calcul: function (invalidated) {
        return invalidated.prop('test')
      }
    })
    res = prop.get()
    return assert.equal(res, 4)
  })
  it('should re-calcul immediately if it invalidate indirectly an immediate property', function () {
    var calculSourceCalls, calcultargetCalls, changeCalls, val
    calculSourceCalls = 0
    calcultargetCalls = 0
    changeCalls = 0
    val = 3
    const sourceProp = new Property({
      calcul: function (invalidated) {
        calculSourceCalls += 1
        val += 1
        return val
      }
    })
    const middleProp = new Property({
      calcul: function (invalidator) {
        return invalidator.prop(sourceProp)
      }
    })
    const targetProp = new Property({
      calcul: function (invalidator) {
        calcultargetCalls += 1
        return invalidator.prop(middleProp)
      },
      change: function (old) {
        changeCalls += 1
      }
    })
    assert.equal(calculSourceCalls, 1, 'nb calcul calls for source')
    assert.equal(calcultargetCalls, 1, 'nb calcul calls for target')
    assert.equal(changeCalls, 1, 'nb change calls')
    assert.equal(targetProp.value, 4)
    assert.equal(targetProp.calculated, true)
    assert.equal(sourceProp.value, 4)
    assert.equal(sourceProp.calculated, true)
    targetProp.get()
    assert.equal(calculSourceCalls, 1, 'nb calcul calls for source')
    assert.equal(calcultargetCalls, 1, 'nb calcul calls for target')
    assert.equal(changeCalls, 1, 'nb change calls')
    assert.equal(targetProp.value, 4)
    assert.equal(targetProp.calculated, true)
    assert.equal(sourceProp.value, 4)
    assert.equal(sourceProp.calculated, true)
    sourceProp.invalidate()
    assert.equal(calculSourceCalls, 2, 'nb calcul calls for source')
    assert.equal(calcultargetCalls, 2, 'nb calcul calls for target')
    assert.equal(changeCalls, 2, 'nb change calls')
    assert.equal(targetProp.value, 5)
    assert.equal(targetProp.calculated, true)
    assert.equal(sourceProp.value, 5)
    assert.equal(sourceProp.calculated, true)
    sourceProp.invalidate()
    assert.equal(calculSourceCalls, 3, 'nb calcul calls for source')
    assert.equal(calcultargetCalls, 3, 'nb calcul calls for target')
    assert.equal(changeCalls, 3, 'nb change calls')
    assert.equal(targetProp.value, 6)
    assert.equal(targetProp.calculated, true)
    assert.equal(sourceProp.value, 6)
    assert.equal(sourceProp.calculated, true)
    targetProp.get()
    assert.equal(calculSourceCalls, 3, 'nb calcul calls for source')
    assert.equal(calcultargetCalls, 3, 'nb calcul calls for target')
    assert.equal(changeCalls, 3, 'nb change calls')
    assert.equal(targetProp.value, 6)
    assert.equal(targetProp.calculated, true)
    assert.equal(sourceProp.value, 6)
    return assert.equal(sourceProp.calculated, true)
  })
})
