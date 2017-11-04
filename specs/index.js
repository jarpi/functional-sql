const mocha = require('mocha')
const chai = require('chai')
const assert = chai.assert
const query = require('../index.js')

describe('SQL - like parser', function() {
	describe('SELECT', function() {
		const nums = [1,2,3,4,5,6,7,8,9]
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

		it('Should throw exception if FROM called multiple times', function() {
			assert.throws(() => { query().select().from([]).from([]).execute() }, 'Duplicate FROM')
		})

		it('Can omit FROM clause', function() {
			assert.deepEqual(query().select().execute(), [])
		})

		it('Can omit SELECT clause', function() {
			assert.deepEqual(query().from(nums).execute(), nums)
		})

		it('Should WHERE clause apply filter with SELECT by obj field', function() {
			function isTeacher(o) { return o.profession === 'teacher' }
			function profession(o) { return o.profession }
			const expectedObjs = ['teacher', 'teacher', 'teacher']
			assert.deepEqual(query().select(profession).from(objs).where(isTeacher).execute(), expectedObjs)
		})

		it('Should WHERE clause apply filter without SELECT', function() {
			function isTeacher(o) { return o.profession === 'teacher' }
			const expectedObjs = [{name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married'},
				{name: 'Michael', profession: 'teacher', age: 50, maritalStatus: 'single'},
				{name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married'}]
			assert.deepEqual(query().select().from(objs).where(isTeacher).execute(), expectedObjs)
		})

		it('Should GROUPBY apply', function() {
			function profession(o) { return o.profession }
			const expectedObjs =
				[
					['teacher',
						[
							{name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married'},
							{name: 'Michael', profession: 'teacher', age: 50, maritalStatus: 'single'},
							{name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married'}
						]
					],
					['scientific',
						[
							{name: 'Anna', profession: 'scientific', age: 20, maritalStatus: 'married'},
							{name: 'Rose', profession: 'scientific', age: 50, maritalStatus: 'married'},
							{name: 'Anna', profession: 'scientific', age: 20, maritalStatus: 'single'},
						]
					],
					['politician',
						[
							{name: 'Anna', profession: 'politician', age: 50, maritalStatus: 'married'}
						]
					]
				]
			assert.deepEqual(query().select().from(objs).groupBy(profession).execute(), expectedObjs)
		})

		it('Should WHERE clause apply with GROUPBY', function() {
			function isTeacher(o) { return o.profession === 'teacher' }
			function profession(o) { return o.profession }
			const expectedObjs =
				[
					['teacher',
						[
							{name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married'},
							{name: 'Michael', profession: 'teacher', age: 50, maritalStatus: 'single'},
							{name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married'}
						]
					]
				]
			assert.deepEqual(query().select().from(objs).where(isTeacher).groupBy(profession).execute(), expectedObjs)
		})


		it('Should SELECT clause apply with GROUPBY', function() {
			function professionGroup(group) { return group[0] }
			function profession(o) { return o.profession }
			const expectedObjs = ["teacher","scientific","politician"]
			assert.deepEqual(query().select(professionGroup).from(objs).groupBy(profession).execute(), expectedObjs)
		})

		it('Should GROUPBY by custom function', function() {
			function isEven(n) { return n%2 === 0 }
			function parity(n) { return isEven(n) ? 'even' : 'odd' }
			const expectedObjs = [['odd',[1,3,5,7,9]], ['even',[2,4,6,8]]]
			assert.deepEqual(query().select().from(nums).groupBy(parity).execute(), expectedObjs)
		})

		it('Should ORDER apply', function() {
			function descendentCompare(number1, number2) { return number2 - number1 }
			const expectedObjs = [9,8,7,6,5,4,3,2,1]
			assert.deepEqual(query().select().from(nums).orderBy(descendentCompare).execute(), expectedObjs)
		})

		it('Should GROUPBY by multiple fields', function() {
			function isEven(n) { return n%2 === 0 }
			function parity(n) { return isEven(n) ? 'even' : 'odd' }
			function isPrime(n) { if(n < 2) { return false; } var divisor = 2; for(; n%divisor !==0; divisor++); return divisor === n;  }
			function prime(n) { return isPrime(n) ? 'prime' : 'divisible' }
			const expectedObjs = [["odd",[["divisible",[1,9]],["prime",[3,5,7]]]],["even",[["prime",[2]],["divisible",[4,6,8]]]]]
			assert.deepEqual(query().select().from(nums).groupBy(parity, prime).execute(), expectedObjs)
		})

		it('Should HAVING apply', function() {
			function isEven(n) { return n%2 === 0 }
			function parity(n) { return isEven(n) ? 'even' : 'odd' }
			function odd(group) { return group[0] === 'odd' }
			const expectedObjs = [['odd',[1,3,5,7,9]]]
			assert.deepEqual(query().select().from(nums).groupBy(parity).having(odd).execute(), expectedObjs)
		})

		it('Should FROM by multiple collections', function(){
			var teachers = [
				{
					teacherId: '1',
					teacherName: 'Peter'
				},
				{
					teacherId: '2',
					teacherName: 'Anna'
				}
			];

			var students = [
				{
					studentName: 'Michael',
					tutor: '1'
				},
				{
					studentName: 'Rose',
					tutor: '2'
				}
			];

			function teacherJoin(join) {
				return join[0].teacherId === join[1].tutor;
			}

			function student(join) {
				return {studentName: join[1].studentName, teacherName: join[0].teacherName};
			}

			const expectedObjs = [{"studentName":"Michael","teacherName":"Peter"},{"studentName":"Rose","teacherName":"Anna"}]
			assert.deepEqual(query().select(student).from(teachers, students).where(teacherJoin).execute(), expectedObjs)
		})

		it.skip('Should WHERE by multiple fields', function(){})
		it.skip('Should HAVING by multiple fields', function(){})
		it.skip('Should ORDER GROUPBY by multiple fields', function(){})


	})
})
