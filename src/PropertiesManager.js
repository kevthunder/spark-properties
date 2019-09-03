const Property = require('./Property')

class PropertiesManager {
  constructor (properties = {}, options = {}) {
    /**
     * @type {Array.<Property>}
     */
    this.properties = []
    this.globalOptions = Object.assign({}, options)
    this.propertiesOptions = Object.assign({}, properties)
    this.init()
  }

  /**
   * @param {*} properties
   * @param {*} options
   * @return {PropertiesManager}
   */
  copyWith (properties = {}, options = {}) {
    return new this.constructor(this.mergePropertiesOptions(this.propertiesOptions, properties), Object.assign({}, this.globalOptions, options))
  }

  useScope (scope) {
    return this.copyWith({}, { scope: scope })
  }

  mergePropertiesOptions (...arg) {
    return arg.reduce((res, opt) => {
      Object.keys(opt).forEach((name) => {
        res[name] = this.mergePropertyOptions(res[name] || {}, opt[name])
      })
      return res
    }, {})
  }

  mergePropertyOptions (oldOpt, newOpt) {
    return Object.assign({}, oldOpt, newOpt)
  }

  initProperties () {
    Object.keys(this.propertiesOptions).forEach((name) => this.addProperty(name, this.propertiesOptions[name]))
    return this
  }

  createScopeGetterSetters () {
    this.properties.forEach((prop) => prop.createScopeGetterSetters())
    return this
  }

  addProperty (name, options) {
    this.properties.push(new Property(Object.assign({ name: name }, this.globalOptions, options)))
  }

  getProperty (name) {
    this.properties.find((prop) => prop.options.name === name)
  }

  getManualDataProperties () {
    return this.properties.reduce((res, prop) => {
      if (prop.getter.calculated && prop.manual) {
        res[prop.name] = prop.get()
      }
      return res
    }, {})
  }

  destroy () {
    this.properties.forEach((prop) => prop.destroy())
  }
}

module.exports = PropertiesManager
