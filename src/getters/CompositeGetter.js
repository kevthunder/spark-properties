const InvalidatedGetter = require('./InvalidatedGetter')
const Collection = require('spark-collection')
const Invalidator = require('../Invalidator')

class CompositeGetter extends InvalidatedGetter {
  init () {
    super.init()
    if (this.prop.opt.default != null) {
      this.baseValue = this.prop.opt.default
    } else {
      this.baseValue = this.prop.value = null
    }
    this.members = new CompositeGetter.Members(this.prop.opt.members)
    if (this.prop.opt.calcul != null) {
      this.members.unshift((prev, invalidator) => {
        return this.prop.opt.calcul.bind(this.prop.opt.scope)(invalidator)
      })
    }
    this.members.changed = (old) => {
      return this.invalidate()
    }
    this.prop.members = this.members

    if (typeof this.prop.opt.composed === 'function') {
      this.join = this.prop.opt.composed
    } else if (typeof this.prop.opt.composed === 'string' && CompositeGetter.joinFunctions[this.prop.opt.composed] != null) {
      this.join = CompositeGetter.joinFunctions[this.prop.opt.composed]
    } else if (this.prop.opt.default === false) {
      this.join = CompositeGetter.joinFunctions.or
    } else if (this.prop.opt.default === true) {
      this.join = CompositeGetter.joinFunctions.and
    } else {
      this.join = CompositeGetter.joinFunctions.last
    }
  }

  calcul () {
    if (this.members.length) {
      if (!this.invalidator) {
        this.invalidator = new Invalidator(this.prop, this.prop.opt.scope)
      }
      this.invalidator.recycle((invalidator, done) => {
        this.prop.value = this.members.reduce((prev, member) => {
          var val
          val = typeof member === 'function' ? member(prev, this.invalidator) : member
          return this.join(prev, val)
        }, this.baseValue)
        done()
        if (invalidator.isEmpty()) {
          this.invalidator = null
        } else {
          invalidator.bind()
        }
      })
    } else {
      this.prop.value = this.baseValue
    }
    this.revalidated()
    return this.prop.value
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
    var fn
    if (this.findRefIndex(null, prop) === -1) {
      fn = function (prev, invalidator) {
        return invalidator.prop(prop)
      }
      fn.ref = {
        name: null,
        obj: prop
      }
      return this.push(fn)
    }
  }

  removeProperty (prop) {
    this.removeRef(null, prop)
  }

  addValueRef (val, name, obj) {
    var fn
    if (this.findRefIndex(name, obj) === -1) {
      fn = function (prev, invalidator) {
        return val
      }
      fn.ref = {
        name: name,
        obj: obj,
        val: val
      }
      return this.push(fn)
    }
  }

  setValueRef (val, name, obj) {
    var fn, i, ref
    i = this.findRefIndex(name, obj)
    if (i === -1) {
      return this.addValueRef(val, name, obj)
    } else if (this.get(i).ref.val !== val) {
      ref = {
        name: name,
        obj: obj,
        val: val
      }
      fn = function (prev, invalidator) {
        return val
      }
      fn.ref = ref
      return this.set(i, fn)
    }
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
      return this.push(fn)
    }
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
      return this.changed(old)
    }
  }
}

module.exports = CompositeGetter
