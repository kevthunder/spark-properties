
const assert = require('chai').assert
const Property = require('../src/Property')

describe('Property', function () {
  describe('utilities', function () {
    it("can return it's fully qualified name", function () {
      const scope = new function Test () {}()
      const prop = new Property({
        default: 3,
        name: 'test',
        scope: scope
      })
      assert.equal(prop.getQualifiedName(), 'Test.test')
    })
    it("can return it's fully qualified name - without scope", function () {
      const prop = new Property({
        default: 3,
        name: 'test'
      })
      assert.equal(prop.getQualifiedName(), 'test')
    })
    it("can return it's fully qualified name - without name", function () {
      const prop = new Property({
        default: 3
      })
      assert.isUndefined(prop.getQualifiedName())
    })
    it("can return it's string value", function () {
      const scope = new function Test () {}()
      const prop = new Property({
        default: 3,
        name: 'test',
        scope: scope
      })
      assert.equal(prop.toString(), '[Property Test.test]')
    })
    it("can return it's string value - without Qualified Name", function () {
      const prop = new Property({
        default: 3
      })
      assert.equal(prop.toString(), '[Property]')
    })
  })
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
  describe('with ManualSetter', function () {
    it('set the value using a custom function', function () {
      let value = 0
      const prop = new Property({
        set: function (val) {
          value = val
        }
      })
      assert.equal(value, 0)
      prop.set(2)
      assert.equal(value, 2)
    })
  })
  describe('with SimpleGetter', function () {
    require('./getters/SimpleGetter')()
  })
  describe('with CalculatedGetter', function () {
    require('./getters/CalculatedGetter')()
  })
  describe('with InvalidatedGetter', function () {
    require('./getters/InvalidatedGetter')()
  })
  describe('with CompositeGetter', function () {
    require('./getters/CompositeGetter')()
  })
  describe('with CollectionSetter', function () {
    require('./setters/CollectionSetter')()
  })
})
