import test from 'ava'
import fuzi from '.'

test('Different images fail', async t => {
	const img1 = 'fixtures/green-circle.png'
	const img2 = 'fixtures/red-square.png'
	const opts = {
		grid: {
			columns: 8,
			rows: 8
		},
		tolerance: {
			hue: 0,
			sat: 0,
			lum: 0,
			alp: 0
		}
	}
	const result = await fuzi(img1, img2, opts)
	t.true(result.fail)
})

test('Identical images pass', async t => {
	const img1 = 'fixtures/green-circle.png'
	const img2 = 'fixtures/green-circle.png'
	const opts = {
		grid: {
			columns: 8,
			rows: 8
		},
		tolerance: {
			hue: 0,
			sat: 0,
			lum: 0,
			alp: 0
		}
	}
	const result = await fuzi(img1, img2, opts)
	t.true(result.pass)
})

test('Tolerance difference is the same when images are swapped', async t => {
	const opts = {
		grid: {
			columns: 8,
			rows: 8
		},
		tolerance: {
			hue: 0,
			sat: 0,
			lum: 0,
			alp: 0
		}
	}

	const img1 = 'fixtures/green-circle.png'
	const img2 = 'fixtures/red-square.png'

	const result1 = await fuzi(img1, img2, opts)
	const result2 = await fuzi(img2, img1, opts)

	t.deepEqual(result1.difference, result2.difference)
})
