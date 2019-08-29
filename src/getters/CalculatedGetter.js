
const BaseGetter = require('./BaseGetter')

class CalculatedGetter extends BaseGetter {
  get () {
    if (!this.calculated) {
      const old = this.prop.value
      const initiated = this.initiated
      this.calcul()
      if (!initiated) {
        this.prop.events.emit('updated', old)
      } else if (this.prop.checkChanges(this.prop.value, old)) {
        this.prop.changed(old)
      }
    }
    return this.prop.value
  }

  calcul () {
    this.prop.value = this.prop.callOptionFunct('calcul')
    this.prop.manual = false
    this.revalidated()
    return this.prop.value
  }
}

module.exports = CalculatedGetter
