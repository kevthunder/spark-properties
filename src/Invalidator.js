const Binder = require('./Binder')
const EventBind = require('./EventBind')

const pluck = function (arr, fn) {
  var found, index
  index = arr.findIndex(fn)
  if (index > -1) {
    found = arr[index]
    arr.splice(index, 1)
    return found
  } else {
    return null
  }
}

class Invalidator extends Binder {
  constructor (invalidated, scope = null) {
    super()
    this.invalidated = invalidated
    this.scope = scope
    this.invalidationEvents = []
    this.recycled = []
    this.unknowns = []
    this.strict = this.constructor.strict
    this.invalid = false
    this.invalidateCallback = () => {
      this.invalidate()
    }
    this.invalidateCallback.owner = this
  }

  invalidate () {
    var functName
    this.invalid = true
    if (typeof this.invalidated === 'function') {
      this.invalidated()
    } else if (typeof this.callback === 'function') {
      this.callback()
    } else if ((this.invalidated != null) && typeof this.invalidated.invalidate === 'function') {
      this.invalidated.invalidate()
    } else if (typeof this.invalidated === 'string') {
      functName = 'invalidate' + this.invalidated.charAt(0).toUpperCase() + this.invalidated.slice(1)
      if (typeof this.scope[functName] === 'function') {
        this.scope[functName]()
      } else {
        this.scope[this.invalidated] = null
      }
    }
    return this
  }

  unknown () {
    if (this.invalidated != null && typeof this.invalidated.unknown === 'function') {
      return this.invalidated.unknown()
    } else {
      return this.invalidate()
    }
  }

  addEventBind (event, target, callback) {
    return this.addBinder(new EventBind(event, target, callback))
  }

  addBinder (binder) {
    if (binder.callback == null) {
      binder.callback = this.invalidateCallback
    }
    if (!this.invalidationEvents.some(function (eventBind) {
      return eventBind.equals(binder)
    })) {
      return this.invalidationEvents.push(pluck(this.recycled, function (eventBind) {
        return eventBind.equals(binder)
      }) || binder)
    }
  }

  getUnknownCallback (prop) {
    var callback
    callback = () => {
      return this.addUnknown(function () {
        return prop.get()
      }, prop)
    }
    callback.ref = {
      prop: prop
    }
    return callback
  }

  addUnknown (fn, prop) {
    if (!this.findUnknown(prop)) {
      fn.ref = {
        prop: prop
      }
      this.unknowns.push(fn)
      return this.unknown()
    }
  }

  findUnknown (prop) {
    if (prop != null) {
      return this.unknowns.find(function (unknown) {
        return unknown.ref.prop === prop
      })
    }
  }

  event (event, target = this.scope) {
    if (this.checkEmitter(target)) {
      return this.addEventBind(event, target)
    }
  }

  value (val, event, target = this.scope) {
    this.event(event, target)
    return val
  }

  prop (prop, target = this.scope) {
    var propInstance
    if (typeof prop === 'string') {
      if ((target.getPropertyInstance != null) && (propInstance = target.getPropertyInstance(prop))) {
        prop = propInstance
      } else {
        return target[prop]
      }
    } else if (!this.checkPropInstance(prop)) {
      throw new Error('Property must be a PropertyInstance or a string')
    }
    this.addEventBind('invalidated', prop.events, this.getUnknownCallback(prop))
    return this.value(prop.get(), 'updated', prop.events)
  }

  propPath (path, target = this.scope) {
    var prop, val
    path = path.split('.')
    val = target
    while ((val != null) && path.length > 0) {
      prop = path.shift()
      val = this.prop(prop, val)
    }
    return val
  }

  propInitiated (prop, target = this.scope) {
    var initiated
    if (typeof prop === 'string' && (target.getPropertyInstance != null)) {
      prop = target.getPropertyInstance(prop)
    } else if (!this.checkPropInstance(prop)) {
      throw new Error('Property must be a PropertyInstance or a string')
    }
    initiated = prop.initiated
    if (!initiated) {
      this.event('updated', prop)
    }
    return initiated
  }

  funct (funct) {
    var invalidator, res
    invalidator = new Invalidator(() => {
      return this.addUnknown(() => {
        var res2
        res2 = funct(invalidator)
        if (res !== res2) {
          return this.invalidate()
        }
      }, invalidator)
    })
    res = funct(invalidator)
    this.invalidationEvents.push(invalidator)
    return res
  }

  validateUnknowns () {
    var unknowns
    unknowns = this.unknowns
    this.unknowns = []
    return unknowns.forEach(function (unknown) {
      return unknown()
    })
  }

  isEmpty () {
    return this.invalidationEvents.length === 0
  }

  bind () {
    this.invalid = false
    this.invalidationEvents.forEach(function (eventBind) {
      eventBind.bind()
    })
    return this
  }

  recycle (fn) {
    var done, res
    this.recycled = this.invalidationEvents
    this.invalidationEvents = []
    done = this.endRecycle.bind(this)
    if (typeof fn === 'function') {
      if (fn.length > 1) {
        return fn(this, done)
      } else {
        res = fn(this)
        done()
        return res
      }
    } else {
      return done
    }
  }

  endRecycle () {
    this.recycled.forEach(function (eventBind) {
      return eventBind.unbind()
    })
    this.recycled = []
    return this
  }

  checkEmitter (emitter) {
    return EventBind.checkEmitter(emitter, this.strict)
  }

  checkPropInstance (prop) {
    return typeof prop.get === 'function' && this.checkEmitter(prop.events)
  }

  unbind () {
    this.invalidationEvents.forEach(function (eventBind) {
      eventBind.unbind()
    })
    return this
  }
};

Invalidator.strict = true

module.exports = Invalidator
