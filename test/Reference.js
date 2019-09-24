
const assert = require('chai').assert
const Reference = require('../src/Reference')

describe('Reference', function () {
  it('can compare 2 simple values', function () {
    assert.isTrue(Reference.compareVal(1, 1))
    assert.isTrue(Reference.compareVal(2, 2))
    assert.isFalse(Reference.compareVal(1, 2))
    assert.isTrue(Reference.compareVal('foo', 'foo'))
    assert.isTrue(Reference.compareVal('bar', 'bar'))
    assert.isFalse(Reference.compareVal('foo', 'bar'))
    assert.isTrue(Reference.compareVal(null, null))
    assert.isFalse(Reference.compareVal('foo', 1))
    assert.isFalse(Reference.compareVal('foo', null))
    assert.isFalse(Reference.compareVal(null, 1))
  })
  it('can compare 2 arrays', function () {
    assert.isTrue(Reference.compareVal([1, 2, 3], [1, 2, 3]))
    assert.isFalse(Reference.compareVal([1, 2], [1, 2, 3]))
    assert.isFalse(Reference.compareVal([1, 2, 3], [1, 3, 3]))
    assert.isFalse(Reference.compareVal([1, 2, 3], [1, 3, 2]))
    assert.isFalse(Reference.compareVal([1, 2, 3], [1, 2]))
    assert.isFalse(Reference.compareVal([1, 2, 3], ['1', 2, 3]))
  })
  it('can compare 2 objects', function () {
    const a = { a: 1, b: 2 }
    const b = { a: 1, b: 2 }
    const c = { a: 1, b: 2, c: 3 }
    assert.isTrue(Reference.compareVal(a, a))
    assert.isTrue(Reference.compareVal(c, c))
    assert.isFalse(Reference.compareVal(a, b))
    assert.isFalse(Reference.compareVal(a, c))
    assert.isFalse(Reference.compareVal(a, null))
    assert.isFalse(Reference.compareVal(null, a))
  })
  it('can compare 2 simple References', function () {
    assert.isTrue(Reference.compareVal(new Reference(1), new Reference(1)))
    assert.isTrue(Reference.compareVal(new Reference(null), new Reference(null)))
    assert.isFalse(Reference.compareVal(new Reference(1), new Reference(2)))
    assert.isFalse(Reference.compareVal(new Reference(), new Reference(null)))
  })
  it('can compare 2 object with equals function', function () {
    assert.isTrue(Reference.compareVal({ equals () { return true } }, 1))
    assert.isTrue(Reference.compareVal({ equals (val) { return val === 1 } }, 1))
    assert.isTrue(Reference.compareVal(1, { equals (val) { return val === 1 } }))
    assert.isFalse(Reference.compareVal({ equals (val) { return val === 1 } }, 2))
  })
  it('can find if it equals a second References', function () {
    assert.isTrue(new Reference({ a: 1, b: 2 }).equals(new Reference({ a: 1, b: 2 })))
    assert.isTrue(new Reference({ a: 1, b: 2, c: 3 }).equals(new Reference({ a: 1, b: 2, c: 3 })))
    assert.isFalse(new Reference({ a: 1, b: 2, c: 3 }).equals(new Reference({ a: 1, b: 2 })))
    assert.isFalse(new Reference({ a: 1, b: 2 }).equals(new Reference({ a: 1, b: 2, c: 3 })))
    assert.isFalse(new Reference({ a: 1, b: 2, c: 3 }).equals(new Reference({ a: 1, b: 2, c: 2 })))
    assert.isFalse(new Reference({ a: 1, b: 2, c: 3 }).equals(new Reference({ a: 1, b: 2, d: 3 })))
    assert.isFalse(new Reference({ a: 1, b: 2, c: 3 }).equals(new Reference({ a: '1', b: 2, c: 3 })))
    assert.isFalse(new Reference({ a: 1, b: 2, c: 3 }).equals(null))
  })
  it('can compare some data', function () {
    assert.isTrue(new Reference({ a: 1, b: 2 }).compareData({ a: 1, b: 2 }))
    assert.isTrue(new Reference({ a: 1, b: 2, c: 3 }).compareData(new Reference({ a: 1, b: 2, c: 3 })))
    assert.isFalse(new Reference({ a: 1, b: 2, c: 3 }).compareData({ a: 1, b: 2 }))
    assert.isFalse(new Reference(2).compareData(3))
    assert.isFalse(new Reference({ a: 1, b: 2, c: 3 }).compareData(null))
  })
  it('can make an object refered', function () {
    const a = Reference.makeReferred({}, { a: 1, b: 2 })
    const b = Reference.makeReferred({}, { a: 1, b: 2 })
    const c = Reference.makeReferred({}, { a: 1, b: 2, c: 3 })
    const d = Reference.makeReferred({}, new Reference({ a: 1, b: 2 }))
    assert.isTrue(a.equals(b))
    assert.isTrue(b.equals(a))
    assert.isTrue(a.equals(d))
    assert.isFalse(a.equals(c))
    assert.isFalse(d.equals(c))
  })
})
