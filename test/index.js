
const assert = require('chai').assert
const index = require('../index')

describe('index file', function () {
  it('return all the classes', function () {
    assert.equal(index.Property.name, 'Property')
    assert.equal(index.PropertiesManager.name, 'PropertiesManager')
    assert.equal(index.watchers.PropertyWatcher.name, 'PropertyWatcher')
  })
})
