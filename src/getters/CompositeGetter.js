const InvalidatedGetter = require('./InvalidatedGetter')
const Collection = require('spark-collection')
const Invalidator = require('../Invalidator')
const Reference = require('../Reference')

class CompositeGetter extends InvalidatedGetter {
  init () {
    super.init()
    if (this.prop.options.default != null) {
      this.baseValue = this.prop.options.default
    } else {
      this.prop.setter.setRawValue(null)
      this.baseValue = null
    }
    this.members = new CompositeGetter.Members(this.prop.options.members)
    if (this.prop.options.calcul != null) {
      this.members.unshift((prev, invalidator) => {
        return this.prop.options.calcul.bind(this.prop.options.scope)(invalidator)
      })
    }
    this.members.changed = (old) => {
      return this.invalidate()
    }
    this.prop.members = this.members

    if (typeof this.prop.options.composed === 'function') {
      this.join = this.prop.options.composed
    } else if (typeof this.prop.options.composed === 'string' && CompositeGetter.joinFunctions[this.prop.options.composed] != null) {
      this.join = CompositeGetter.joinFunctions[this.prop.options.composed]
    } else if (this.prop.options.default === false) {
      this.join = CompositeGetter.joinFunctions.or
    } else if (this.prop.options.default === true) {
      this.join = CompositeGetter.joinFunctions.and
    } else {
      this.join = CompositeGetter.joinFunctions.last
    }
  }

  calcul () {
    if (this.members.length) {
      if (!this.invalidator) {
        this.invalidator = new Invalidator(this.prop, this.prop.options.scope)
      }
      this.invalidator.recycle((invalidator, done) => {
        this.prop.setter.setRawValue(this.members.reduce((prev, member) => {
          var val
          val = typeof member === 'function' ? member(prev, this.invalidator) : member
          return this.join(prev, val)
        }, this.baseValue))
        done()
        if (invalidator.isEmpty()) {
          this.invalidator = null
        } else {
          invalidator.bind()
        }
      })
    } else {
      this.prop.setter.setRawValue(this.baseValue)
    }
    this.revalidated()
    return this.prop.value
  }

  /**
   * @param {PropertyDescriptorMap} opt
   * @return {PropertyDescriptorMap}
   */
  getScopeGetterSetters (opt) {
    opt = super.getScopeGetterSetters(opt)
    const members = this.members
    opt[this.prop.options.name + 'Members'] = {
      get: function () {
        return members
      }
    }
    return opt
  }
}

CompositeGetter.joinFunctions = {
  and: function (a, b) {
    return a && b
  },
  or: function (a, b) {
    return a || b
  },
  last: function (a, b) {
    return b
  },
  sum: function (a, b) {
    return a + b
  }
}

CompositeGetter.Members = class Members extends Collection {
  addProperty (prop) {
    if (this.findRefIndex(null, prop) === -1) {
      this.push(Reference.makeReferred(function (prev, invalidator) {
        return invalidator.prop(prop)
      }, {
        prop: prop
      }))
    }
    return this
  }

  addPropertyPath (name, obj) {
    if (this.findRefIndex(name, obj) === -1) {
      this.push(Reference.makeReferred(function (prev, invalidator) {
        return invalidator.propPath(name, obj)
      }, {
        name: name,
        obj: obj
      }))
    }
    return this
  }

  removeProperty (prop) {
    this.removeRef(null, prop)
    return this
  }

  addValueRef (val, name, obj) {
    if (this.findRefIndex(name, obj) === -1) {
      this.push(Reference.makeReferred(function (prev, invalidator) {
        return val
      }, {
        name: name,
        obj: obj,
        val: val
      }))
    }
    return this
  }

  setValueRef (val, name, obj) {
    const i = this.findRefIndex(name, obj)
    if (i === -1) {
      this.addValueRef(val, name, obj)
    } else if (this.get(i).ref.val !== val) {
      this.set(i, Reference.makeReferred(function (prev, invalidator) {
        return val
      }, {
        name: name,
        obj: obj,
        val: val
      }))
    }
    return this
  }

  getValueRef (name, obj) {
    return this.findByRef(name, obj).ref.val
  }

  addFunctionRef (fn, name, obj) {
    if (this.findRefIndex(name, obj) === -1) {
      fn.ref = {
        name: name,
        obj: obj
      }
      this.push(fn)
    }
    return this
  }

  findByRef (name, obj) {
    return this._array[this.findRefIndex(name, obj)]
  }

  findRefIndex (name, obj) {
    return this._array.findIndex(function (member) {
      return (member.ref != null) && member.ref.obj === obj && member.ref.name === name
    })
  }

  removeRef (name, obj) {
    var index, old
    index = this.findRefIndex(name, obj)
    if (index !== -1) {
      old = this.toArray()
      this._array.splice(index, 1)
      this.changed(old)
    }
    return this
  }
}

module.exports = CompositeGetter
