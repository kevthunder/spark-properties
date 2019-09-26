module.exports = {
  Binder: require('./Binder'),
  EventBind: require('./EventBind'),
  Invalidator: require('./Invalidator'),
  PropertiesManager: require('./PropertiesManager'),
  Property: require('./Property'),
  Reference: require('./Reference'),
  getters: {
    BaseGetter: require('./getters/BaseGetter'),
    CalculatedGetter: require('./getters/CalculatedGetter'),
    CompositeGetter: require('./getters/CompositeGetter'),
    InvalidatedGetter: require('./getters/InvalidatedGetter'),
    ManualGetter: require('./getters/ManualGetter'),
    SimpleGetter: require('./getters/SimpleGetter')
  },
  setters: {
    BaseSetter: require('./setters/BaseSetter'),
    BaseValueSetter: require('./setters/BaseValueSetter'),
    CollectionSetter: require('./setters/CollectionSetter'),
    ManualSetter: require('./setters/ManualSetter'),
    SimpleSetter: require('./setters/SimpleSetter')
  },
  watchers: {
    CollectionPropertyWatcher: require('./watchers/CollectionPropertyWatcher'),
    PropertyWatcher: require('./watchers/PropertyWatcher')
  }
}
