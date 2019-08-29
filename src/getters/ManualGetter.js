const BaseGetter = require('./BaseGetter')

class ManualGetter extends BaseGetter {
  get () {
    this.prop.value = this.prop.callOptionFunct('get')
    this.calculated = true
    this.initiated = true
    return this.prop.value
  }
}

module.exports = ManualGetter
