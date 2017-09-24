function query() {

    this.filter = function(o) { return o }
    this.from = []
	this.filterCallable = true
	this.fromCalls = 0
	this.selectCalls = 0

    this.select = function(f) {
		this.filter = f || this.filter
		this.selectCalls++
        return this
    }

    this.from = function(v) {
        this.from = v
		this.fromCalls++
        return this
    }

    this.execute = function() {
		if (this.selectCalls > 1) throw new Error('Duplicate SELECT')
		if (this.fromCalls > 1) throw new Error('Duplicate FROM')
		return this.from.map(this.filter)
    }

    return this
}

module.exports = query
