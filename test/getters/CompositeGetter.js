
const assert = require('chai').assert
const Property = require('../../src/Property')
const Invalidator = require('../../src/Invalidator')
const Collection = require('spark-collection')

module.exports = function () {
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
  it('returns a value composed of many nested remote properties', function () {
    let res
    const remote = {
      prop1Property: new Property({
        default: {
          val: 1
        }
      }),
      prop2Property: new Property({
        default: {
          valProperty: new Property({
            default: 3
          })
        }
      }),
      prop3: {
        valProperty: new Property({
          default: 5
        })
      }
    }

    const prop = new Property({
      composed: 'sum',
      members: [],
      default: 0
    })
    prop.members.addPropertyPath('prop1.val', remote)
    prop.members.addPropertyPath('prop2.val', remote)
    res = prop.get()
    assert.equal(res, 4)
    prop.members.addPropertyPath('prop3.val', remote)
    res = prop.get()
    assert.equal(res, 9)
    prop.members.removeRef({
      name: 'prop3.val',
      obj: remote
    })
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
  it('can create Getter for the members on Scope', function () {
    const scope = {}
    const prop = new Property({
      name: 'test',
      composed: 'sum',
      members: [1, 2, 3],
      scope: scope
    })
    prop.createScopeGetterSetters()
    assert.equal(scope.test, 6)
    assert.deepEqual(scope.testMembers.toArray(), [1, 2, 3])
    scope.testMembers.add(4)
    assert.equal(scope.test, 10)
  })
}
