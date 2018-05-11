function query() {

	const defaultFn = o => { return o }

	this.selectValue = defaultFn
	this.whereValueOr = []
	this.whereValueAnd = []
	this.groupValue = defaultFn
	this.havingValue = defaultFn
	this.orderValue = defaultFn
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
		const values = Array.prototype.slice.call(arguments)
		this.fromValue = (values.length<2?v:values[0].map(i=>{ return values[1].map(x=>{ return [i,x] })})
			.reduce((p,i) => {p.push(i[0]);p.push(i[1]);return p},[]))
		this.fromCalls++
		return this
	}

	this.where = function(v) {
    const args = Array.prototype.slice.call(arguments)
    if (args.length > 1) {
      args.forEach(a => {
        this.whereValueOr.push(a)
      })
      return this
    }
    this.whereValueAnd.push(v)
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
		return [].concat(arr).sort((val1, val2) => {
			return this.orderValue(val1[0] || val1, val2[0] || val2)
		})
	}

    const whereFilterOr = (arr) => {
      if (this.whereValueOr.length < 1) return arr
       const r = this.whereValueOr.reduce((acc, i) => {
            return acc.concat(arr.filter(i))
        }, [])
      return r
    }

    const whereFilterAnd = (arr) => {
      if (this.whereValueAnd.length < 1) return arr
       const r = this.whereValueAnd.reduce((acc, i) => {
            return acc.filter(i)
        },arr)
      return r
    }

	this.execute = function() {
		if (this.selectCalls > 1) throw new Error('Duplicate SELECT')
		if (this.fromCalls > 1) throw new Error('Duplicate FROM')
		if (this.groupCalls > 1) throw new Error('Duplicate GROUPBY')
		if (this.orderCalls > 1) throw new Error('Duplicate ORDERBY')
		return orderFilter(havingFilter(
			groupBy(whereFilterAnd(whereFilterOr(this.fromValue)))))
			.map(this.selectValue)
	}

	return this
}

module.exports = function() {return new query()}
