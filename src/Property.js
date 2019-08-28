const EventEmitter = require('events')

class Property {
  constructor (options = {}) {
    this.opt = Object.assign({}, Property.defaultOptions, options)
    this.init()
  }

  init () {
    this.events = new this.opt.EventEmitterClass()
    this.calculated = false
    this.initiated = false
  }

  copyWith (options) {
    return new this.constructor(Object.assign({}, this.opt, options))
  }

  get () {
    this.calculated = true
    if (typeof this.opt.get === 'function') {
      return this.callOptionFunct('get')
    }
    if (!this.initiated) {
      this.initiated = true
      this.events.emit('updated')
    }
    return this.output()
  }

  set (val) {
    return this.setAndCheckChanges(val)
  }

  setAndCheckChanges (val) {
    var old
    val = this.ingest(val)
    this.revalidated()
    if (this.checkChanges(val, this.value)) {
      old = this.value
      this.value = val
      this.manual = true
      this.changed(old)
    }
    return this
  }

  checkChanges (val, old) {
    return val !== old
  }

  destroy () {
    if (this.opt.destroy === true && this.value != null && this.value.destroy != null) {
      this.value.destroy()
    }
    if (typeof this.opt.destroy === 'function') {
      this.callOptionFunct('destroy', this.value)
    }
    this.value = null
  }

  callOptionFunct (funct, ...args) {
    if (typeof funct === 'string') {
      funct = this.opt[funct]
    }
    if (typeof funct.overrided === 'function') {
      args.push((...args) => {
        return this.callOptionFunct(funct.overrided, ...args)
      })
    }
    return funct.apply(this.opt.scope || this, args)
  }

  revalidated () {
    this.calculated = true
    this.initiated = true
    this.value = this.ingest(this.opt.default)
    return this
  }

  ingest (val) {
    if (typeof this.opt.ingest === 'function') {
      val = this.callOptionFunct('ingest', val)
    }
    return val
  }

  output () {
    if (typeof this.opt.output === 'function') {
      return this.callOptionFunct('output', this.value)
    } else {
      return this.value
    }
  }

  changed (old) {
    this.events.emit('updated', old)
    this.events.emit('changed', old)
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
    this.events.emit('invalidated')
  }
}
Property.defaultOptions = {
  EventEmitterClass: EventEmitter
}
module.exports = Property
