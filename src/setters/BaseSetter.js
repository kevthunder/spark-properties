
class BaseSetter {
  constructor (prop) {
    this.prop = prop
    this.init()
  }

  init () {
    this.calculated = false
    this.initiated = false
  }

  set (val) {
    throw new Error('Not implemented')
  }

  setRawValue (val) {
    this.prop.value = val
  }

  checkChanges (val, old) {
    return val !== old
  }
}

module.exports = BaseSetter
