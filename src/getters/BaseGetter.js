
class BaseGetter {
  constructor (prop) {
    this.prop = prop
  }

  init () {
    this.calculated = false
    this.initiated = false
  }

  get () {
    throw new Error('Not implemented')
  }

  output () {
    if (typeof this.prop.options.output === 'function') {
      return this.prop.callOptionFunct('output', this.prop.value)
    } else {
      return this.prop.value
    }
  }

  revalidated () {
    this.calculated = true
    this.initiated = true
    return this
  }

  unknown () {
    if (this.calculated) {
      this.invalidateNotice()
    }
    return this
  }

  invalidate () {
    if (this.calculated) {
      this.calculated = false
      this.invalidateNotice()
    }
    return this
  }

  invalidateNotice () {
    this.prop.events.emit('invalidated')
  }

  destroy () {
  }
}

module.exports = BaseGetter
