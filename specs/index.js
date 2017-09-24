const mocha = require('mocha')
const chai = require('chai')
const assert = chai.assert
const query = require('../index.js')

describe('SQL - like parser', function() {
    describe('SELECT', function() {
            const nums = [1,2,3]
			const objs = [
			  {name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married'},
			  {name: 'Michael', profession: 'teacher', age: 50, maritalStatus: 'single'},
			  {name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married'},
			  {name: 'Anna', profession: 'scientific', age: 20, maritalStatus: 'married'},
			  {name: 'Rose', profession: 'scientific', age: 50, maritalStatus: 'married'},
			  {name: 'Anna', profession: 'scientific', age: 20, maritalStatus: 'single'},
			  {name: 'Anna', profession: 'politician', age: 50, maritalStatus: 'married'}
            ]

        it('Should SELECT * array of primitives', function() {
            assert.deepEqual(query().select().from(nums).execute(), nums)
        })

        it('Should SELECT * array of objects', function() {
			assert.deepEqual(query().select().from(objs).execute(), objs)
        })

		it('Should SELECT {field} array of objects', function() {
			const expectedObjs = ['teacher', 'teacher', 'teacher', 'scientific','scientific','scientific', 'politician']

			function profession(person) {
				return person.profession
			}
			assert.deepEqual(query().select(profession).from(objs).execute(), expectedObjs)
		})

		it('Should throw exception if SELECT called multiple times', function() {
			assert.throws(() => { query().select().select().from().execute() }, 'Duplicate SELECT')
		})

	})
})




