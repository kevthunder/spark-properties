class Reference {
  constructor (data) {
    this.data = data
  }

  equals (ref) {
    return ref != null && ref.constructor === this.constructor && this.compareData(ref.data)
  }

  compareData (data) {
    return Reference.compareVal(this.data, data)
  }

  /**
   * @param {*} val1
   * @param {*} val2
   * @return {boolean}
   */
  static compareVal (val1, val2) {
    if (val1 === val2) {
      return true
    }
    if (val1 == null || val2 == null) {
      return false
    }
    if (typeof val1.equals === 'function') {
      return val1.equals(val2)
    }
    if (typeof val2.equals === 'function') {
      return val2.equals(val1)
    }
    if (Array.isArray(val1) && Array.isArray(val2)) {
      return val1.length === val2.length && val1.every((val, i) => {
        return this.compareVal(val, val2[i])
      })
    }
    // if (typeof val1 === 'object' && typeof val2 === 'object') {
    //   return Object.keys(val1).length === Object.keys(val2).length && Object.keys(val1).every((key) => {
    //     return this.compareVal(val1[key], val2[key])
    //   })
    // }
    return false
  }

  static makeReferred (obj, data) {
    obj.ref = new Reference(data)
    obj.equals = function (obj2) {
      return obj2 != null && this.ref.equals(obj2.ref)
    }
    return obj
  }
};

module.exports = Reference
