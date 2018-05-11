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

		it('Should throw exception if GROUPBY called multiple times', function() {
			assert.throws(() => { query().select().groupBy([]).groupBy([]).execute() }, 'Duplicate GROUPBY')
		})

		it('Should throw exception if ORDERBY called multiple times', function() {
			assert.throws(() => { query().select().orderBy([]).orderBy([]).execute() }, 'Duplicate ORDERBY')
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

    it('Should WHERE by multiple fields', function(){
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

      function tutor1(join) {
        return join[1].tutor === "1";
      }

			const expectedObjs =[{"studentName":"Michael","teacherName":"Peter"}]
        assert.deepEqual(query().select(student).from(teachers, students).where(teacherJoin).where(tutor1).execute(), expectedObjs)
      })

      it('Should WHERE handle OR', function(){
        var numbers = [1, 2, 3, 4, 5, 7];

        function lessThan3(number) {
          return number < 3;
        }

        function greaterThan4(number) {
          return number > 4;
        }
        const expectedObjs = [1, 2, 5, 7]
        assert.deepEqual(query().select().from(numbers).where(lessThan3, greaterThan4).execute(), expectedObjs)
      })

		it('Should HAVING by multiple fields', function() {
			var numbers = [1, 2, 1, 3, 5, 6, 1, 2, 5, 6];

      function id(value) {
        return value;
      }

      function frequency(group) {
        return { value: group[0], frequency: group[1].length };
      }
			function greatThan1(group) {
        return group[1].length > 1;
      }

      function isPair(group) {
        return group[0] % 2 === 0;
      }
			assert.deepEqual(query().select(frequency).from(numbers).groupBy(id).having(greatThan1).having(isPair).execute(),  [{"value":2,"frequency":2},{"value":6,"frequency":2}])
		})
		
		it('Should ORDER GROUPBY by multiple fields', function() {

			var persons = [
        {name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married'},
        {name: 'Michael', profession: 'teacher', age: 50, maritalStatus: 'single'},
        {name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married'},
        {name: 'Anna', profession: 'scientific', age: 20, maritalStatus: 'married'},
        {name: 'Rose', profession: 'scientific', age: 50, maritalStatus: 'married'},
        {name: 'Anna', profession: 'scientific', age: 20, maritalStatus: 'single'},
        {name: 'Anna', profession: 'politician', age: 50, maritalStatus: 'married'}
      ];

			function professionCount(group) {
				return [group[0], group[1].length];
			}

			function profession(person) {
        return person.profession;
      }

			function naturalCompare(value1, value2) {
        if (value1 < value2) {
          return -1;
        } else if (value1 > value2) {
          return 1;
        } else {
          return 0;
        }
      }
			// SELECT profession, count(profession) FROM persons GROUPBY profession ORDER BY profession
			assert.deepEqual(query().select(professionCount).from(persons).groupBy(profession).orderBy(naturalCompare).execute(), [["politician",1],["scientific",3],["teacher",3]])
		})


	})
})
