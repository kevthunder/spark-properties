const EventEmitter = require('events')
const Invalidator = require('./Invalidator')
const PropertyWatcher = require('./PropertyWatcher')

class Property {
  constructor (options = {}) {
    this.opt = Object.assign({}, Property.defaultOptions, options)
    this.init()
  }

  init () {
    this.events = new this.opt.EventEmitterClass()
    this.calculated = false
    this.initiated = false
    this.value = this.ingest(this.opt.default)
    this.loadChangeOption()
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
    if (typeof this.opt.calcul === 'function') {
      if (this.invalidator) {
        this.invalidator.validateUnknowns()
      }
      if (!this.calculated) {
        const old = this.value
        const initiated = this.initiated
        this.calcul()
        if (!initiated) {
          this.events.emit('updated', old)
        } else if (this.checkChanges(this.value, old)) {
          this.changed(old)
        }
      }
    } else {
      this.calculated = true
      if (typeof this.opt.get === 'function') {
        return this.callOptionFunct('get')
      }
      if (!this.initiated) {
        this.initiated = true
        this.events.emit('updated')
      }
    }
    return this.output()
  }

  calcul () {
    if (this.opt.calcul.length === 0) {
      this.value = this.callOptionFunct('calcul')
      this.manual = false
    } else {
      if (!this.invalidator) {
        this.invalidator = new Invalidator(this, this.obj)
      }
      this.invalidator.recycle((invalidator, done) => {
        this.value = this.callOptionFunct('calcul', invalidator)
        this.manual = false
        done()
        if (invalidator.isEmpty()) {
          this.invalidator = null
        } else {
          invalidator.bind()
        }
      })
    }
    this.revalidated()
    return this.value
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
    if (this.invalidator != null) {
      return this.invalidator.unbind()
    }
    this.value = null
  }

  callOptionFunct (funct, ...args) {
    if (typeof funct === 'string') {
      funct = this.opt[funct]
    }
    return funct.apply(this.opt.scope || this, args)
  }

  revalidated () {
    this.calculated = true
    this.initiated = true
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
      if (!this.calculated && this.invalidator != null) {
        this.invalidator.unbind()
      }
    }
    return this
  }

  unknown () {
    if (this.calculated || this.active === false) {
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
