const EventEmitter = require('events')
const PropertyWatcher = require('./PropertyWatcher')
const SimpleGetter = require('./getters/SimpleGetter')
const CalculatedGetter = require('./getters/CalculatedGetter')
const InvalidatedGetter = require('./getters/InvalidatedGetter')
const ManualGetter = require('./getters/ManualGetter')

class Property {
  constructor (options = {}) {
    this.opt = Object.assign({}, Property.defaultOptions, options)
    this.init()
  }

  init () {
    this.events = new this.opt.EventEmitterClass()
    this.value = this.ingest(this.opt.default)
    this.makeGetter()
    this.loadChangeOption()
  }

  makeGetter () {
    if (typeof this.opt.get === 'function') {
      this.getter = new ManualGetter(this)
    } else if (typeof this.opt.calcul === 'function') {
      if (this.opt.calcul.length === 0) {
        this.getter = new CalculatedGetter(this)
      } else {
        this.getter = new InvalidatedGetter(this)
      }
    } else {
      this.getter = new SimpleGetter(this)
    }
  }

  loadChangeOption () {
    if (typeof this.opt.change === 'function') {
      return new PropertyWatcher({
        property: this,
        callback: this.opt.change,
        scope: this.opt.scope,
        autoBind: true
      })
    } else if (this.opt.change != null && typeof this.opt.change.copyWith === 'function') {
      return this.opt.change.copyWith({
        property: this,
        autoBind: true
      })
    }
  }

  copyWith (options) {
    return new this.constructor(Object.assign({}, this.opt, options))
  }

  get () {
    this.getter.get()
    return this.output()
  }

  invalidate () {
    this.getter.invalidate()
    return this
  }

  unknown () {
    this.getter.unknown()
    return this
  }

  set (val) {
    return this.setAndCheckChanges(val)
  }

  setAndCheckChanges (val) {
    var old
    val = this.ingest(val)
    this.getter.revalidated()
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
    this.getter.destroy()
    this.value = null
  }

  callOptionFunct (funct, ...args) {
    if (typeof funct === 'string') {
      funct = this.opt[funct]
    }
    return funct.apply(this.opt.scope || this, args)
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

}
Property.defaultOptions = {
  EventEmitterClass: EventEmitter
}
module.exports = Property
