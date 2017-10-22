function query() {

    this.selectValue = function(o) { return o }
    this.whereValue = function(o) { return o }
    this.groupValue = function(o) { return o }
    this.havingValue = function(o) { return o }
    this.orderValue = function(o) { return o }
    this.fromValue = []
	this.fromCalls = 0
	this.selectCalls = 0
	this.groupCalls = 0
	this.havingCalls = 0
	this.orderCalls = 0

    this.select = function(f) {
		this.selectValue = f || this.selectValue
		this.selectCalls++
        return this
    }

    this.from = function(v) {
        this.fromValue = v
		this.fromCalls++
        return this
    }

	this.where = function(v) {
		this.whereValue = v
		return this
	}

	this.groupBy = function(v) {
		this.groupValue = Array.prototype.slice.call(arguments)
		this.groupCalls++
		return this
	}

	this.having = function(v) {
		this.havingValue = v
		this.havingCalls++
		return this
	}

	this.orderBy = function(v) {
		this.orderValue = v
		this.orderCalls++
		return this
	}

  const groupBy = (arr, i) => {
    const idx = i || 0
    if (this.groupCalls < 1) return arr
    if (!this.groupValue[idx]) return arr
    return arr.reduce( (prev, o) => {
      if (prev.indexOf(this.groupValue[idx](o)) === -1) {
        prev.push(this.groupValue[idx](o));
      }
      return prev
    },[])
    .map ((o) => {
    return [o,
      groupBy(arr.filter( (oo) => {
        return this.groupValue[idx](oo) === o
      }), idx+1)]
    })
  }

  const havingFilter = (arr) => {
		if (!this.havingCalls) return arr
		if (!this.groupCalls) throw new Error('Call HAVING without GROUPS')
		return arr.filter(this.havingValue)
	}

  const orderFilter = (arr) => {
		if (!this.orderCalls) return arr
		return arr.sort(this.orderValue)
	}

  this.execute = function() {
	if (this.selectCalls > 1) throw new Error('Duplicate SELECT')
	if (this.fromCalls > 1) throw new Error('Duplicate FROM')
      return orderFilter(havingFilter(
            // Group by
            groupBy(this.fromValue
			// Where
			.filter(this.whereValue))))
			// Select
			.map(this.selectValue)

  }

  return this
}

module.exports = query
