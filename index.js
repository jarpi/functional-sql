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
		this.groupValue = v
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

  const groupBy = (arr) => {
    if (this.groupCalls < 1) return arr
    return arr.reduce( (prev, o) => {
      if (prev.indexOf(this.groupValue(o)) === -1) {
        prev.push(this.groupValue(o));
      }
      return prev
    },[])
    .map ((o) => {
    return [o,
      this.fromValue.filter( (oo) => {
        return this.groupValue(oo) === o
      })]
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
	return orderFilter(havingFilter(groupBy(this.fromValue
			// Where
			.filter(this.whereValue))))
			// Select
			.map(this.selectValue)

  }

  return this
}

module.exports = query
