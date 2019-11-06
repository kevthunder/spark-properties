
const assert = require('chai').assert
const Property = require('../../src/Property')
const EventEmitter = require('events').EventEmitter
const Invalidator = require('../../src/Invalidator')

module.exports = function () {
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
    assert.equal(prop.getter.calculated, false, 'calculated initially false')
    prop.get()
    assert.exists(emitter.event)
    assert.equal(prop.value, 3)
    assert.equal(prop.getter.calculated, true, 'calculated true after get')
    emitter.emit()
    assert.notExists(emitter.event)
    assert.equal(prop.value, 3)
    return assert.equal(prop.getter.calculated, false, 'calculated false after invalidation')
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
    assert.equal(prop.getter.calculated, false, 'calculated initially false')
    assert.isFalse(binded)
    prop.get()
    assert.equal(prop.getter.calculated, true, 'calculated true after get')
    assert.isTrue(binded)
    prop.invalidate()
    assert.equal(prop.getter.calculated, false, 'calculated false after invalidation')
    assert.isFalse(binded, 'binded should be false after invalidation')
    prop.get()
    assert.equal(prop.getter.calculated, true, 'calculated true after get 2')
    return assert.isTrue(binded)
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
    return assert.instanceOf(prop.getter.invalidator, Invalidator)
  })
  it('allow implicit target for invalidators', function () {
    var prop, res
    prop = new Property({
      calcul: function (invalidated) {
        return invalidated.propByName('test')
      },
      scope: {
        test: 4
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
      change: function (val, old) {
        changeCalls += 1
      }
    })
    assert.equal(calculSourceCalls, 1, 'nb calcul calls for source')
    assert.equal(calcultargetCalls, 1, 'nb calcul calls for target')
    assert.equal(changeCalls, 1, 'nb change calls')
    assert.equal(targetProp.value, 4)
    assert.equal(targetProp.getter.calculated, true)
    assert.equal(sourceProp.value, 4)
    assert.equal(sourceProp.getter.calculated, true)
    targetProp.get()
    assert.equal(calculSourceCalls, 1, 'nb calcul calls for source')
    assert.equal(calcultargetCalls, 1, 'nb calcul calls for target')
    assert.equal(changeCalls, 1, 'nb change calls')
    assert.equal(targetProp.value, 4)
    assert.equal(targetProp.getter.calculated, true)
    assert.equal(sourceProp.value, 4)
    assert.equal(sourceProp.getter.calculated, true)
    sourceProp.invalidate()
    assert.equal(calculSourceCalls, 2, 'nb calcul calls for source')
    assert.equal(calcultargetCalls, 2, 'nb calcul calls for target')
    assert.equal(changeCalls, 2, 'nb change calls')
    assert.equal(targetProp.value, 5)
    assert.equal(targetProp.getter.calculated, true)
    assert.equal(sourceProp.value, 5)
    assert.equal(sourceProp.getter.calculated, true)
    sourceProp.invalidate()
    assert.equal(calculSourceCalls, 3, 'nb calcul calls for source')
    assert.equal(calcultargetCalls, 3, 'nb calcul calls for target')
    assert.equal(changeCalls, 3, 'nb change calls')
    assert.equal(targetProp.value, 6)
    assert.equal(targetProp.getter.calculated, true)
    assert.equal(sourceProp.value, 6)
    assert.equal(sourceProp.getter.calculated, true)
    targetProp.get()
    assert.equal(calculSourceCalls, 3, 'nb calcul calls for source')
    assert.equal(calcultargetCalls, 3, 'nb calcul calls for target')
    assert.equal(changeCalls, 3, 'nb change calls')
    assert.equal(targetProp.value, 6)
    assert.equal(targetProp.getter.calculated, true)
    assert.equal(sourceProp.value, 6)
    return assert.equal(sourceProp.getter.calculated, true)
  })
  it('calling destoy unbind the invalidator', function () {
    const emitter = new EventEmitter()
    const prop = new Property({
      calcul: function (invalidator) {
        invalidator.event('test', emitter)
        return 4
      }
    })
    const val = prop.get()
    assert.equal(val, 4)
    assert.equal(emitter.listenerCount('test'), 1)
    prop.destroy()
    assert.equal(emitter.listenerCount('test'), 0)
  })
  it('can handle constantly changing calculated value', function () {
    let changing = 0
    let invalidated = 0
    const changingProp = new Property({
      calcul: function () {
        changing++
        return changing
      }
    })
    const middleProp = new Property({
      calcul: function (invalidator) {
        return invalidator.prop(changingProp)
      }
    })
    const invalidatedProp = new Property({
      calcul: function (invalidator) {
        return invalidator.prop(middleProp)
      }
    })
    invalidatedProp.events.on('invalidated', function () {
      invalidated++
    })
    assert.equal(invalidated, 0)
    changingProp.invalidate()
    assert.equal(invalidated, 0)
    assert.equal(invalidatedProp.get(), changing)
    assert.equal(invalidated, 0)
    changingProp.invalidate()
    assert.equal(invalidated, 1)
    assert.equal(invalidatedProp.getter.invalidator.unknowns.length, 1)
    changingProp.invalidate()
    assert.equal(invalidated, 1)
    assert.equal(invalidatedProp.get(), changing)
    assert.equal(invalidated, 1)
    assert.equal(invalidatedProp.getter.invalidator.unknowns.length, 0)
    changingProp.invalidate()
    assert.equal(invalidated, 2)
    assert.equal(invalidatedProp.getter.invalidator.unknowns.length, 1)
  })
}
