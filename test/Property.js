
const assert = require('chai').assert
const Property = require('../src/Property')
const EventEmitter = require('events')
const Invalidator = require('../src/Invalidator')
const Collection = require('spark-collection')

describe('Property', function () {
  describe('with ManualGetter', function () {
    it('can invalidate a property that has a get function', function () {
      const prop = new Property({
        get: function () {
          return 3
        }
      })
      assert.isUndefined(prop.value)
      assert.equal(prop.getter.calculated, false)
      const res = prop.get()
      assert.equal(res, 3)
      assert.equal(prop.getter.calculated, true)
      prop.invalidate()
      assert.equal(prop.getter.calculated, false)
    })
  })
  describe('with SimpleGetter', function () {
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
  })
  describe('with CalculatedGetter', function () {
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
        change: function (old) {
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
  })
  describe('with InvalidatedGetter', function () {
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
  })
  describe('with CompositeGetter', function () {
    it('should return collection when collection config is on', function () {
      var prop
      prop = new Property({
        composed: true
      })
      assert.instanceOf(prop.getter.members, Collection)
    })
    it('should not return collection when collection config is undefined', function () {
      var prop
      prop = new Property()
      assert.notInstanceOf(prop.getter.members, Collection)
    })
    it('has null as default value', function () {
      var prop, res
      prop = new Property({
        composed: true
      })
      res = prop.get()
      return assert.equal(res, null)
    })
    it('returns default if no members', function () {
      var prop, res
      prop = new Property({
        composed: true,
        default: 'hi'
      })
      res = prop.get()
      return assert.equal(res, 'hi')
    })
    it('returns a value composed(and) of many values', function () {
      var prop, res
      prop = new Property({
        composed: true,
        members: [true, true],
        default: true
      })
      res = prop.get()
      assert.isTrue(res)
      prop.members.push(false)
      prop.members.push(true)
      res = prop.get()
      return assert.isFalse(res)
    })
    it('returns a value composed(or) of many values', function () {
      var prop, res
      prop = new Property({
        composed: true,
        members: [false, false],
        default: false
      })
      res = prop.get()
      assert.isFalse(res)
      prop.members.push(true)
      res = prop.get()
      return assert.isTrue(res)
    })
    it('returns a value composed of many values using a user function', function () {
      var prop, res
      prop = new Property({
        composed: function (a, b) {
          return a + b
        },
        members: [1, 2, 3],
        default: 0
      })
      res = prop.get()
      return assert.equal(res, 6)
    })
    it('returns a value composed of many values using predefined function sum', function () {
      var prop, res
      prop = new Property({
        composed: 'sum',
        members: [1, 2, 3],
        default: 0
      })
      res = prop.get()
      return assert.equal(res, 6)
    })
    it('returns a value composed of many values using predefined function last', function () {
      var prop, res
      prop = new Property({
        composed: 'last',
        members: [1, 2, 3],
        default: 0
      })
      res = prop.get()
      return assert.equal(res, 3)
    })
    it('returns a value composed of many values using default function for string', function () {
      var prop, res
      prop = new Property({
        composed: true,
        members: ['foo', 'bar', 'baz'],
        default: ''
      })
      res = prop.get()
      return assert.equal(res, 'baz')
    })
    it('use the setted value as the new base value', function () {
      var prop, res
      prop = new Property({
        composed: function (a, b) {
          return a + b
        },
        members: [1, 2, 3],
        default: 0
      })
      res = prop.get()
      assert.equal(res, 6)
      prop.set(10)
      res = prop.get()
      return assert.equal(res, 16)
    })
    it('use calcul as a member', function () {
      var prop, res
      prop = new Property({
        composed: 'sum',
        calcul: function (invalidator) {
          assert.instanceOf(invalidator, Invalidator)
          return this.test
        },
        members: [2, 5],
        default: 0,
        scope: {
          test: 8
        }
      })
      assert.instanceOf(prop.getter.members, Collection)
      res = prop.get()
      return assert.equal(res, 15)
    })
    it('returns a value composed of many functions', function () {
      var fnFalse, fnTrue, fnTrue2, fnTrue3, prop, res
      fnTrue = function () {
        return true
      }
      fnTrue2 = function () {
        return true
      }
      fnFalse = function () {
        return false
      }
      fnTrue3 = function () {
        return true
      }
      prop = new Property({
        composed: true,
        members: [fnTrue, fnTrue2],
        default: true
      })
      res = prop.get()
      assert.isTrue(res)
      prop.members.push(fnFalse)
      prop.members.push(fnTrue3)
      res = prop.get()
      return assert.isFalse(res)
    })
    it('returns a value composed of many ref value', function () {
      var prop, res
      prop = new Property({
        composed: true,
        members: [],
        default: true
      })
      res = prop.get()
      assert.isTrue(res, 'initial result')
      prop.members.addValueRef(true, 'prop1')
      prop.members.addValueRef(true, 'prop2')
      res = prop.get()
      assert.isTrue(res, 'after added 2 true values')
      prop.members.addValueRef(false, 'prop3')
      prop.members.addValueRef(false, 'prop4')
      prop.members.addValueRef(true, 'prop5')
      res = prop.get()
      assert.isFalse(res, 'after added 2 false values')
      prop.members.removeRef('prop3')
      res = prop.get()
      assert.isFalse(res, 'removed 1 false values')
      prop.members.removeRef('prop4')
      res = prop.get()
      return assert.isTrue(res, 'removed 2 false values')
    })
    it('can get a ref value', function () {
      var prop, res
      prop = new Property({
        composed: function (a, b) {
          return a + b
        },
        members: []
      })
      prop.members.addValueRef(2, 'prop1')
      prop.members.addValueRef(3, 'prop2')
      res = prop.members.getValueRef('prop1')
      return assert.equal(res, 2)
    })
    it('can override the same value', function () {
      var prop, res
      prop = new Property({
        composed: function (a, b) {
          return a + b
        },
        default: 0
      })
      prop.members.setValueRef(2, 'prop1')
      prop.members.setValueRef(2, 'prop2')
      res = prop.get()
      assert.equal(res, 4)
      prop.members.setValueRef(3, 'prop2')
      res = prop.get()
      return assert.equal(res, 5)
    })
    it('trigger change only if the overriding value is different', function () {
      var calls, prop, res
      calls = 0
      prop = new Property({
        composed: function (a, b) {
          return a + b
        },
        default: 0,
        change: function () {
          return calls++
        }
      })
      assert.equal(calls, 1)
      prop.members.setValueRef(2, 'prop1')
      prop.members.setValueRef(2, 'prop2')
      assert.equal(calls, 3)
      res = prop.get()
      assert.equal(res, 4)
      assert.equal(calls, 3)
      prop.members.setValueRef(2, 'prop2')
      res = prop.get()
      assert.equal(res, 4)
      assert.equal(calls, 3)
      prop.members.setValueRef(3, 'prop2')
      res = prop.get()
      assert.equal(res, 5)
      return assert.equal(calls, 4)
    })
    it('returns a value composed of many ref functions', function () {
      var prop, res
      prop = new Property({
        composed: true,
        members: [],
        default: true
      })
      res = prop.get()
      assert.isTrue(res, 'initial result')
      prop.members.addFunctionRef(function () {
        return true
      }, 'prop1')
      prop.members.addFunctionRef(function () {
        return true
      }, 'prop2')
      res = prop.get()
      assert.isTrue(res, 'after added 2 true values')
      prop.members.addFunctionRef(function () {
        return false
      }, 'prop3')
      prop.members.addFunctionRef(function () {
        return false
      }, 'prop4')
      prop.members.addFunctionRef(function () {
        return true
      }, 'prop5')
      res = prop.get()
      assert.isFalse(res, 'after added 2 false values')
      prop.members.removeRef('prop3')
      res = prop.get()
      assert.isFalse(res, 'removed 1 false values')
      prop.members.removeRef('prop4')
      res = prop.get()
      return assert.isTrue(res, 'removed 2 false values')
    })
    it('returns a value composed of many remote properties', function () {
      var res
      const subProp1 = new Property({
        default: true
      })
      const subProp2 = new Property({
        default: true
      })
      const subProp3 = new Property({
        default: false
      })
      const prop = new Property({
        composed: true,
        members: [],
        default: true
      })
      prop.members.addProperty(subProp1)
      prop.members.addProperty(subProp2)
      res = prop.get()
      assert.isTrue(res, 'result')
      prop.members.addProperty(subProp3)
      res = prop.get()
      assert.isFalse(res, 'added property')
      prop.members.removeProperty(subProp3)
      res = prop.get()
      return assert.isTrue(res, 'removed property')
    })
    it.skip('returns a value composed of many nested remote properties', function () {
      var nested, prop, remote, res
      remote = {
        prop3: {}
      }
      new Property({
        default: {
          val: 1
        }
      }).bind(remote)
      nested = {}
      new Property({
        default: 3
      }).bind(nested)
      new Property({
        default: nested
      }).bind(remote)
      new Property({
        default: 5
      }).bind(remote.prop3)
      prop = new Property({
        composed: 'sum',
        members: [],
        default: 0
      })
      prop.members.addPropertyRef('prop1.val', remote)
      prop.members.addPropertyRef('prop2.val', remote)
      res = prop.get()
      assert.equal(res, 4)
      prop.members.addPropertyRef('prop3.val', remote)
      res = prop.get()
      assert.equal(res, 9)
      prop.members.removeRef('prop3.val', remote)
      res = prop.get()
      return assert.equal(res, 4)
    })
    it('invalidate the result when adding a member', function () {
      var prop, res
      prop = new Property({
        composed: true,
        members: [true, true],
        default: true
      })
      assert.isFalse(prop.getter.calculated)
      res = prop.get()
      assert.isTrue(res)
      assert.isTrue(prop.getter.calculated)
      prop.members.push(false)
      return assert.isFalse(prop.getter.calculated)
    })
    it('invalidate the result when a member is invalidated', function () {
      var res
      const subProp1 = new Property({
        get: function () {
          return true
        }
      })
      const subProp2 = new Property({
        get: function () {
          return true
        }
      })
      const subProp3 = new Property({
        get: function () {
          return false
        }
      })
      const prop = new Property({
        composed: true,
        members: [],
        default: true
      })
      prop.members.addProperty(subProp1)
      prop.members.addProperty(subProp2)
      prop.members.addProperty(subProp3)
      assert.isFalse(prop.getter.calculated, 'initial calculated value')
      res = prop.get()
      assert.isFalse(res)
      assert.isTrue(prop.getter.calculated, 'calculated value after get')
      assert.equal(prop.getter.invalidator.unknowns.length, 0, 'unknowns before invalidation')
      subProp2.invalidate()
      return assert.isAbove(prop.getter.invalidator.unknowns.length, 0, 'unknowns after invalidation')
    })
  })
})
