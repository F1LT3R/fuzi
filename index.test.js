import test from 'ava'
import fuzi from '.'

test('title', async t => {
	const expected = 'fixtures/green-circle.png'
	const actual = 'fixtures/red-square.png'
	const opts = {
		grid: {
			columns: 16,
			rows: 8
		},
		tolerance: {
			hue: 0,
			sat: 0,
			lum: 0,
			alp: 0
		}
	}
	const result = await fuzi(expected, actual, opts)
	t.true(result.pass)
})
