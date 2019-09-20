
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
  it('can compare 2 simple object', function () {
    assert.isTrue(Reference.compareVal({ a: 1, b: 2 }, { a: 1, b: 2 }))
    assert.isTrue(Reference.compareVal({ a: 1, b: 2, c: 3 }, { a: 1, b: 2, c: 3 }))
    assert.isFalse(Reference.compareVal({ a: 1, b: 2, c: 3 }, { a: 1, b: 2 }))
    assert.isFalse(Reference.compareVal({ a: 1, b: 2 }, { a: 1, b: 2, c: 3 }))
    assert.isFalse(Reference.compareVal({ a: 1, b: 2, c: 3 }, { a: 1, b: 2, c: 2 }))
    assert.isFalse(Reference.compareVal({ a: 1, b: 2, c: 3 }, { a: 1, b: 2, d: 3 }))
    assert.isFalse(Reference.compareVal({ a: 1, b: 2, c: 3 }, { a: '1', b: 2, c: 3 }))
    assert.isFalse(Reference.compareVal({ a: 1, b: 2, c: 3 }, null))
    assert.isFalse(Reference.compareVal(null, { a: 1, b: 2, c: 3 }))
  })
  it('can compare 2 Reference', function () {
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
})
