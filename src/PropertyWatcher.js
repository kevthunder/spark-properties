
const Binder = require('./Binder')

class PropertyWatcher extends Binder {
  constructor (options1) {
    super()
    this.options = options1
    this.invalidateCallback = () => {
      return this.invalidate()
    }
    this.updateCallback = (old) => {
      return this.update(old)
    }
    if (this.options != null) {
      this.loadOptions(this.options)
    }
    this.init()
  }

  loadOptions (options) {
    this.scope = options.scope
    if (options.loaderAsScope && (options.loader != null)) {
      this.scope = options.loader
    }
    this.property = options.property
    this.callback = options.callback
    this.autoBind = options.autoBind
    return this
  }

  copyWith (options) {
    return new this.constructor(Object.assign({}, this.options, options))
  }

  init () {
    if (this.autoBind) {
      return this.checkBind()
    }
  }

  getProperty () {
    if (typeof this.property === 'string') {
      this.property = this.scope.getPropertyInstance(this.property)
    }
    return this.property
  }

  checkBind () {
    return this.toggleBind(this.shouldBind())
  }

  shouldBind () {
    return true
  }

  canBind () {
    return this.getProperty() != null
  }

  doBind () {
    this.update()
    this.getProperty().events.on('invalidated', this.invalidateCallback)
    return this.getProperty().events.on('updated', this.updateCallback)
  }

  doUnbind () {
    this.getProperty().events.off('invalidated', this.invalidateCallback)
    return this.getProperty().events.off('updated', this.updateCallback)
  }

  getRef () {
    if (typeof this.property === 'string') {
      return {
        property: this.property,
        target: this.scope,
        callback: this.callback
      }
    } else {
      return {
        property: this.property.property.name,
        target: this.property.obj,
        callback: this.callback
      }
    }
  }

  invalidate () {
    return this.getProperty().get()
  }

  update (old) {
    var value
    value = this.getProperty().get()
    return this.handleChange(value, old)
  }

  handleChange (value, old) {
    return this.callback.call(this.scope, old)
  }
};

module.exports = PropertyWatcher
