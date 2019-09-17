
const assert = require('chai').assert
const Binder = require('../src/Binder')

describe('Binder', function () {
  it('can toggle bind', function () {
    let callBind = 0
    let callUnbind = 0
    class Test extends Binder {
      doBind () {
        callBind++
      }

      doUnbind () {
        callUnbind++
      }
    }
    const obj = new Test()
    assert.equal(callBind, 0)
    assert.equal(callUnbind, 0)
    obj.toggleBind()
    assert.equal(callBind, 1)
    assert.equal(callUnbind, 0)
    obj.toggleBind()
    assert.equal(callBind, 1)
    assert.equal(callUnbind, 1)
    obj.toggleBind()
    assert.equal(callBind, 2)
    assert.equal(callUnbind, 1)
  })

  it('warns that the subclass should implement doBind', function () {
    class Test extends Binder {}
    const obj = new Test()
    assert.throws(obj.bind.bind(obj), 'Not implemented')
  })

  it('warns that the subclass should implement doUnbind', function () {
    class Test extends Binder {
      doBind () {}
    }
    const obj = new Test()
    obj.bind()
    assert.throws(obj.unbind.bind(obj), 'Not implemented')
  })
})
