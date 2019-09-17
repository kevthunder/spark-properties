
const assert = require('chai').assert
const Property = require('../src/Property')
const PropertyWatcher = require('../src/PropertyWatcher')

describe('PropertyWatcher', function () {
  it('allow access to old and new value in callback function', function () {
    var call = 0
    const prop = new Property({
      default: 7
    })
    const watcher = new PropertyWatcher({
      property: prop,
      callback: function (val, old) {
        if (call === 0) {
          assert.equal(val, 7)
          assert.isUndefined(old)
        } else {
          assert.equal(val, 11)
          assert.equal(old, 7)
        }
        call++
      }
    })
    watcher.bind()
    prop.set(11)
    assert.equal(call, 2)
  })
})
