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
			columns: 1,
			rows: 1
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

test('Scorecard ANSI log', async t => {
	const img1 = 'fixtures/red-square.png'
	const img2 = 'fixtures/green-circle.png'
	const opts = {
		grid: {
			columns: 8,
			rows: 8
		},
		tolerance: {
			hue: 1,
			sat: 20,
			lum: 0.2,
			alp: 0
		}
	}
	const result = await fuzi(img1, img2, opts)
	t.is(result.scorecard, '\u001B[42m   \u001B[49m\u001B[101m\u001B[1m\u001B[30m▛▛\u001B[39m\u001B[22m\u001B[49m\u001B[42m   \u001B[49m\n\u001B[42m \u001B[49m\u001B[101m\u001B[1m\u001B[30m▛▌▌▌▌▛\u001B[39m\u001B[22m\u001B[49m\u001B[42m \u001B[49m\n\u001B[42m \u001B[49m\u001B[101m\u001B[1m\u001B[30m▌▘▘▘▘▌\u001B[39m\u001B[22m\u001B[49m\u001B[42m \u001B[49m\n\u001B[101m\u001B[1m\u001B[30m▛▌▘▘▘▘▌▛\u001B[39m\u001B[22m\u001B[49m\n\u001B[101m\u001B[1m\u001B[30m▛▌▘▘▘▘▌▛\u001B[39m\u001B[22m\u001B[49m\n\u001B[42m \u001B[49m\u001B[101m\u001B[1m\u001B[30m▌▘▘▘▘▌\u001B[39m\u001B[22m\u001B[49m\u001B[42m \u001B[49m\n\u001B[42m \u001B[49m\u001B[101m\u001B[1m\u001B[30m▛▌▌▌▌▛\u001B[39m\u001B[22m\u001B[49m\u001B[42m \u001B[49m\n\u001B[42m   \u001B[49m\u001B[101m\u001B[1m\u001B[30m▛▛\u001B[39m\u001B[22m\u001B[49m\u001B[42m   \u001B[49m\n')
})

test('Failure grid', async t => {
	const img2 = 'fixtures/green-circle.jpg'
	const img1 = 'fixtures/green-circle.png'
	const opts = {
		grid: {
			columns: 8,
			rows: 8
		},
		tolerance: {
			hue: 1,
			sat: 20,
			lum: 0.2,
			alp: 0
		}
	}
	const result = await fuzi(img1, img2, opts)
	t.true(result.fail)
	const expectedBooleanGrid = [
		[1, 1, 1, 0, 0, 1, 1, 1],
		[1, 0, 1, 1, 1, 1, 0, 1],
		[1, 1, 1, 1, 1, 1, 1, 1],
		[0, 1, 1, 1, 1, 1, 1, 0],
		[0, 1, 1, 1, 1, 1, 1, 0],
		[1, 1, 1, 1, 1, 1, 1, 1],
		[1, 0, 1, 1, 1, 1, 0, 1],
		[1, 1, 1, 0, 0, 1, 1, 1]
	]
	t.deepEqual(result.grid, expectedBooleanGrid)
})

test('Failure scorecard', async t => {
	const img2 = 'fixtures/green-circle.jpg'
	const img1 = 'fixtures/green-circle.png'
	const opts = {
		grid: {
			columns: 8,
			rows: 8
		},
		tolerance: {
			hue: 1,
			sat: 20,
			lum: 0.2,
			alp: 0
		}
	}
	const result = await fuzi(img1, img2, opts)
	t.true(result.fail)
	t.is(result.scorecard, '\u001B[42m   \u001B[49m\u001B[101m\u001B[1m\u001B[30m▖▖\u001B[39m\u001B[22m\u001B[49m\u001B[42m   \u001B[49m\n\u001B[42m \u001B[49m\u001B[101m\u001B[1m\u001B[30m▖\u001B[39m\u001B[22m\u001B[49m\u001B[42m    \u001B[49m\u001B[101m\u001B[1m\u001B[30m▖\u001B[39m\u001B[22m\u001B[49m\u001B[42m \u001B[49m\n\u001B[42m        \u001B[49m\n\u001B[101m\u001B[1m\u001B[30m▖\u001B[39m\u001B[22m\u001B[49m\u001B[42m      \u001B[49m\u001B[101m\u001B[1m\u001B[30m▖\u001B[39m\u001B[22m\u001B[49m\n\u001B[101m\u001B[1m\u001B[30m▖\u001B[39m\u001B[22m\u001B[49m\u001B[42m      \u001B[49m\u001B[101m\u001B[1m\u001B[30m▖\u001B[39m\u001B[22m\u001B[49m\n\u001B[42m        \u001B[49m\n\u001B[42m \u001B[49m\u001B[101m\u001B[1m\u001B[30m▖\u001B[39m\u001B[22m\u001B[49m\u001B[42m    \u001B[49m\u001B[101m\u001B[1m\u001B[30m▖\u001B[39m\u001B[22m\u001B[49m\u001B[42m \u001B[49m\n\u001B[42m   \u001B[49m\u001B[101m\u001B[1m\u001B[30m▖▖\u001B[39m\u001B[22m\u001B[49m\u001B[42m   \u001B[49m\n')
})

test('Failure channelDiff', async t => {
	const img2 = 'fixtures/red-square.png'
	const img1 = 'fixtures/green-circle.png'
	const opts = {
		grid: {
			columns: 2,
			rows: 2
		},
		tolerance: {
			hue: 1,
			sat: 20,
			lum: 0.2,
			alp: 0
		}
	}
	const result = await fuzi(img1, img2, opts)
	t.true(result.fail)
	const expectedChannelDiff = [
		{
			alp: null,
			hue: 230.82648004909436,
			lum: 0.5740655637254903,
			sat: 2.4081286401750646
		},
		{
			alp: null,
			hue: 230.82653532885195,
			lum: 0.5743109011182597,
			sat: 2.4113116318023344
		},
		{
			alp: null,
			hue: 230.82644002267557,
			lum: 0.5740326526118258,
			sat: 2.4096818361904866
		},
		{
			alp: null,
			hue: 230.82648969707805,
			lum: 0.5740057253370097,
			sat: 2.4070243109352845
		}
	]
	t.deepEqual(result.channelDiff, expectedChannelDiff)
})

test('OnError callback', async t => {
	const img2 = 'fixtures/red-square.png'
	const img1 = 'fixtures/green-circle.png'
	t.plan(9)
	const opts = {
		grid: {
			columns: 8,
			rows: 8
		},
		display: {
			images: 16
		},
		errorLog: (msg => {
			t.log(msg)
			t.pass()
		})
	}
	const result = await fuzi(img1, img2, opts)
	t.true(result.fail)
})
