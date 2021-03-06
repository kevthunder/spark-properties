
const assert = require('chai').assert
const Property = require('../../src/Property')
const Collection = require('spark-collection')

module.exports = function () {
  it('should not edit original value of a collection property', function () {
    var original, prop, res
    prop = new Property({
      collection: true
    })
    original = [1, 2, 3]
    prop.set(original)
    res = prop.get()
    assert.equal(res.toString(), '1,2,3')
    res.push(4)
    assert.equal(res.toString(), '1,2,3,4')
    assert.equal(prop.get().toString(), '1,2,3,4')
    return assert.equal(original.toString(), '1,2,3')
  })
  it('should return collection when collection config is on', function () {
    var prop, res
    prop = new Property({
      collection: true,
      default: [1, 2, 3]
    })
    res = prop.get()
    assert.instanceOf(res, Collection)
    return assert.equal(res.toString(), '1,2,3')
  })
  it('should not return collection when collection config is undefined', function () {
    var prop, res
    prop = new Property({
      default: 1
    })
    res = prop.get()
    return assert.notInstanceOf(res, Collection)
  })
  it('can edit collection when no initial value', function () {
    var prop
    prop = new Property({
      collection: true
    })
    assert.equal(prop.get().count(), 0)
    prop.get().push(4)
    assert.equal(prop.get().count(), 1)
    return assert.equal(prop.get().toString(), '4')
  })
  it('should call change function when collection changed', function () {
    var callcount, prop, res
    callcount = 0
    prop = new Property({
      collection: true,
      default: [1, 2, 3],
      change: function (val, old) {
        callcount += 1
      }
    })
    res = prop.get()
    assert.equal(callcount, 1)
    assert.equal(res.count(), 3)
    res.push(4)
    assert.equal(res.count(), 4)
    assert.equal(res.toString(), '1,2,3,4')
    return assert.equal(callcount, 2)
  })
  it('can check items before calling change function', function () {
    var callcount, prop, res
    callcount = 0
    prop = new Property({
      collection: {
        compare: true
      },
      default: [1, 2, 3],
      change: function (val, old) {
        callcount += 1
      }
    })
    res = prop.get()
    assert.equal(res.toString(), '1,2,3')
    assert.equal(callcount, 1)
    prop.set([1, 2, 3])
    res = prop.get()
    assert.equal(res.toString(), '1,2,3')
    assert.equal(callcount, 1)
    prop.set([1, 3, 2])
    res = prop.get()
    assert.equal(res.toString(), '1,3,2')
    assert.equal(callcount, 2)
    prop.set([1, 3, 2])
    res = prop.get()
    assert.equal(res.toString(), '1,3,2')
    assert.equal(callcount, 2)
    prop.set([1, 3, 2, 4])
    res = prop.get()
    assert.equal(res.toString(), '1,3,2,4')
    return assert.equal(callcount, 3)
  })
  it('can check items before calling change function while unordered', function () {
    var callcount, prop, res
    callcount = 0
    prop = new Property({
      collection: {
        compare: true,
        ordered: false
      },
      default: [1, 2, 3],
      change: function (val, old) {
        callcount += 1
      }
    })
    res = prop.get()
    assert.equal(res.toString(), '1,2,3')
    assert.equal(callcount, 1)
    prop.set([1, 2, 3])
    res = prop.get()
    assert.equal(res.toString(), '1,2,3')
    assert.equal(callcount, 1)
    prop.set([1, 3, 2])
    res = prop.get()
    assert.equal(res.toString(), '1,2,3')
    assert.equal(callcount, 1)
    prop.set([1, 3, 2])
    res = prop.get()
    assert.equal(res.toString(), '1,2,3')
    assert.equal(callcount, 1)
    prop.set([1, 3, 2, 4])
    res = prop.get()
    assert.equal(res.toString(), '1,3,2,4')
    return assert.equal(callcount, 2)
  })
  it('can check items with user function before calling change function', function () {
    var callcount, prop, res
    callcount = 0
    prop = new Property({
      collection: {
        compare: function (a, b) {
          return a.toString() === b.toString()
        }
      },
      default: [1, 2, 3],
      change: function (val, old) {
        callcount += 1
      }
    })
    res = prop.get()
    assert.equal(res.toString(), '1,2,3')
    assert.equal(callcount, 1)
    prop.set([1, '2', 3])
    res = prop.get()
    assert.equal(res.toString(), '1,2,3')
    assert.equal(callcount, 1)
    prop.set([1, 3, 2])
    res = prop.get()
    assert.equal(res.toString(), '1,3,2')
    return assert.equal(callcount, 2)
  })
  it('can check caculated items before calling change function', function () {
    var callcount, prop, res, val
    callcount = 0
    val = [1, 2, 3]
    prop = new Property({
      collection: {
        compare: true
      },
      calcul: function () {
        return val
      },
      change: function (val, old) {
        callcount += 1
      }
    })
    res = prop.get()
    assert.equal(res.toString(), '1,2,3')
    assert.equal(callcount, 1)
    val = [1, 2, 3]
    prop.invalidate()
    res = prop.get()
    assert.equal(res.toString(), '1,2,3')
    assert.equal(callcount, 1)
    val = [1, 2, 3, 4]
    prop.invalidate()
    res = prop.get()
    assert.equal(res.toString(), '1,2,3,4')
    assert.equal(callcount, 2)
  })
  it('should call itemAdded function when something is added', function () {
    var callcount, prop, res, shouldAdd
    callcount = 0
    shouldAdd = [1, 2, 3]
    prop = new Property({
      collection: true,
      default: [1, 2, 3],
      itemAdded: function (item) {
        assert.include(shouldAdd, item)
        callcount += 1
      }
    })
    res = prop.get()
    assert.equal(callcount, 3)
    assert.equal(res.count(), 3)
    shouldAdd = [4, 5]
    res.splice(4, 0, 4, 5)
    assert.equal(res.count(), 5)
    assert.equal(res.toString(), '1,2,3,4,5')
    assert.equal(callcount, 5)
  })
  it('should call itemRemoved function when something is removed', function () {
    var callcount, prop, res
    callcount = 0
    prop = new Property({
      collection: true,
      default: [1, 2, 3, 4, 5],
      itemRemoved: function (item) {
        assert.include([4, 5], item)
        callcount += 1
      }
    })
    res = prop.get()
    assert.equal(callcount, 0)
    assert.equal(res.count(), 5)
    res.splice(3, 2)
    assert.equal(res.count(), 3)
    assert.equal(res.toString(), '1,2,3')
    return assert.equal(callcount, 2)
  })
  it('should pass the old value of an uninitiated collection as a Collection', function () {
    var callcount, prop
    callcount = 0
    prop = new Property({
      collection: true,
      change: function (val, old) {
        assert.isArray(val.toArray())
        assert.isArray(old.toArray())
        callcount += 1
      }
    })
    assert.equal(callcount, 1)
    assert.equal(prop.get().count(), 0)
    prop.set(4)
    assert.equal(prop.get().count(), 1)
    assert.equal(prop.get().toString(), '4')
    assert.equal(callcount, 2)
  })
  it('can add method to a collection', function () {
    var prop, res
    prop = new Property({
      collection: {
        test: function () {
          return 'test'
        }
      },
      default: [1, 2, 3]
    })
    res = prop.get()
    assert.instanceOf(res, Collection)
    assert.equal(res.test(), 'test')
  })
  it('can foward method added to a collection', function () {
    var prop, res
    prop = new Property({
      collection: {
        test: function () {
          return 'test'
        }
      },
      default: [1, 2, 3]
    })
    res = prop.get()
    assert.instanceOf(res, Collection)
    assert.equal(res.test(), 'test')
    res = res.filter(function () {
      return true
    })
    assert.instanceOf(res, Collection)
    return assert.equal(res.test(), 'test')
  })

  it('can be composed of another collection property', function () {
    const all = new Property({
      collection: true,
      composed: true
    })
    const some = new Property({
      collection: true,
      default: [1, 2, 3]
    })
    const someMore = new Property({
      collection: true,
      default: [4, 5, 6]
    })
    assert.deepEqual(all.get().toArray(), [])
    all.members.addProperty(some)
    assert.deepEqual(all.get().toArray(), [1, 2, 3])
    all.members.addProperty(someMore)
    assert.deepEqual(all.get().toArray(), [1, 2, 3, 4, 5, 6])
    someMore.get().add(7)
    assert.deepEqual(someMore.get().toArray(), [4, 5, 6, 7])
    assert.deepEqual(all.get().toArray(), [1, 2, 3, 4, 5, 6, 7])
    const somePair = someMore.get().filter(i => i % 2 === 0)
    somePair.add(8)
    assert.deepEqual(all.get().toArray(), [1, 2, 3, 4, 5, 6, 7])
  })
}
