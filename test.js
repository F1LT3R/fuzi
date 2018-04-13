const getPixels = require('get-pixels')
const color = require('color')
const chalk = require('chalk')
const chromafi = require('chromafi')

const style = {
	title: chalk.yellow.underline
}

const grad = ' ░▒▓█'
const bMap = {
	H___: '▘',
	_S__: '▝',
	__L_: '▖',
	___A: '▗',
	HS__: '▀',
	HSL_: '▛',
	HSLA: '█',
	_SL_: '▞',
	_SLA: '▟',
	__LA: '▄',
	H__A: '▚',
	H_L_: '▌',
	_S_A: '▐',
	H_LA: '▙',
	HS_A: '▜',
}

const loadPixels = path => new Promise((resolve, reject) => {
	getPixels(path, function(err, pixels) {
		if (err) {
			return reject(err)
		}
		resolve(pixels)
	})
})

const stat = (img, coords) => {
	const {x1, y1, x2, y2, w, h} = coords

	const width = img.shape[0]

	const channelSum = {
		r: 0,
		b: 0,
		g: 0,
		a: 0
	}

	const pixelCount = w * h

	for (let y = y1; y < y2; y++) {
		for (let x = x1; x < x2; x++) {
			const idx = ((width * y) + x) << 2
			channelSum.r += img.data[idx]
			channelSum.g += img.data[idx + 1]
			channelSum.b += img.data[idx + 2]
			channelSum.a += img.data[idx + 3]
		}
	}

	const stat = {
		r: (channelSum.r / pixelCount) / 4,
		b: (channelSum.g / pixelCount) / 4,
		g: (channelSum.b / pixelCount) / 4,
		a: (channelSum.a / pixelCount) / 4,
	}

	const average = color({
		r: stat.r,
		g: stat.g,
		b: stat.b
	}).hsl()

	stat.hue = average.color[0]
	stat.sat = average.color[1]
	stat.lum = average.color[2]

	return stat
}

const makeGrid = (width, height, opts) => {
	// The sub-divided width/height
	const w = width / opts.grid.columns
	const h = height / opts.grid.rows

	const size = opts.grid.columns * opts.grid.rows
	const grid = Array(size).fill().map((e, idx) => {
		const x = idx % opts.grid.columns
		const y = (idx - x) / opts.grid.columns

		// Grid location
		const l = {x, y}

		const x1 = x * w
		const y1 = y * h

		// Window coords
		const c = {
			x1: Math.floor(x1),
			y1: Math.floor(y1),
			x2: Math.floor(x1 + w),
			y2: Math.floor(y1 + h),
			w: Math.floor(w),
			h: Math.floor(h)
		}

		return {l, c}
	})

	return grid
}

const statGridSquares = (img, grid) =>
	grid.map(square => Object.assign(square,
		{stat: stat(img, square.c)}
	))

const outputScorecard = (channelDiff, opts) => {
	console.log()
	console.log(
		chalk.yellow.underline('Scorecard'.padEnd(opts.grid.columns, ' ') + '\n')
	)
	let termOutput = ''
	for (let y = 0; y < opts.grid.rows; y++) {
		for (let x = 0; x < opts.grid.columns; x++) {
			const n = y * (opts.grid.columns) + x
			let b = ''
			b += channelDiff.hue[n] ? 'H' : '_'
			b += channelDiff.sat[n] ? 'S' : '_'
			b += channelDiff.lum[n] ? 'L' : '_'
			b += channelDiff.alp[n] ? 'A' : '_'
			const bChar = bMap[b] || ''

			if (bChar) {
				termOutput += chalk.bgRedBright.bold.black(bChar)
			} else {
				termOutput += chalk.bgGreen(' ')
			}
		}
		termOutput += '\n'
	}
	console.log(termOutput)
}

const pad = (str, opts, columns) =>
	str.padEnd(columns || opts.grid.columns, ' ') + '\n'

const logTitle = (str, opts) => {
	console.log(style.title(pad(str, opts)))
}

const outputStatus = (pass, maxDiff, opts) => {
	const title = 'Status'
	logTitle(title, opts)

	if (pass) {
		console.log(chalk.bgGreen.black.bold(' PASS '))
	} else {
		console.log(chalk.bgRedBright.black.bold(' FAIL '))
	}

	const chromafiOpts = {
		lineNumbers: false,
		codePad: 0
	}

	console.log()
	console.log(chalk.magenta('You expected the tolerance to be:'))
	console.log()
	console.log(chromafi(opts.tolerance, chromafiOpts))

	console.log(chalk.magenta('The actual channel difference was:'))
	console.log(chalk.gray.italic.underline('(Use these values in `opts.tolerance` to make the test pass.)'))
	console.log()
	const toleranceDiff = {
		hue: maxDiff.hue,
		sat: maxDiff.sat,
		lum: maxDiff.lum,
		alp: maxDiff.alp
	}
	console.log(chromafi(toleranceDiff, chromafiOpts))

	return pass
}

const imagesDidFuzzyMatch = maxDiff => {
	const pass = (
		maxDiff.hue +
		maxDiff.sat +
		maxDiff.lum +
		maxDiff.alp
	) === 0
	return pass
}

const outputVisualDiff = (visualDiff, opts) => {
	logTitle('Visual Diff', opts)

	let termOutput = ''
	while (visualDiff.length > 0) {
		const row = visualDiff.splice(0, opts.grid.columns)
		row.forEach(square => {
			termOutput += square.col(square.char)
		})
		termOutput += '\n'
	}
	console.log(termOutput)
}

const compare = async (img1, img2, opts) => {
	const image1 = await loadPixels(img1)
	const image2 = await loadPixels(img2)

	const [w1, h1] = image1.shape
	const [w2, h2] = image2.shape

	const grid1 = makeGrid(w1, h1, opts)
	const grid2 = makeGrid(w2, h2, opts)

	const size = opts.grid.columns * opts.grid.rows

	const visualDiff = Array(size).fill(0)
	const channelDiff = {
		hue: Array(size).fill(0),
		sat: Array(size).fill(0),
		lum: Array(size).fill(0),
		alp: Array(size).fill(0)
	}

	const maxDiff = {
		hue: 0,
		sat: 0,
		lum: 0,
		alp: 0
	}

	const gridStat1 = statGridSquares(image1, grid1)
	const gridStat2 = statGridSquares(image2, grid2)

	const differential = (channel, s1, s2, idx) => {
		const cDiff = s1[channel] - s2[channel]
		if (cDiff > opts.tolerance[channel]) {
			channelDiff[channel][idx] += 1
			if (cDiff > maxDiff[channel]) {
				maxDiff[channel] = cDiff
			}
		}
		return cDiff
	}

	gridStat1.forEach((square, idx) => {
		const s1 = square.stat
		const s2 = gridStat2[idx].stat

		const hueDiff = differential('hue', s1, s2, idx)
		const satDiff = differential('sat', s1, s2, idx)
		const lumDiff = differential('lum', s1, s2, idx)
		const alpDiff = differential('alp', s1, s2, idx)

		const h = parseInt((360 / maxDiff.hue) * hueDiff || 1)
		const s = parseInt((100 / maxDiff.sat) * satDiff || 1)
		const l = parseInt((100 / maxDiff.lum) * lumDiff || 1)

		const diffColor = color({h, s, l})
			.rgb().color.map(c => parseInt(c, 10))

		visualDiff[idx] = {
			// Use foreground and background colors to hide
			// the luninance characters in most situations
			col: chalk.bgRgb(...diffColor).rgb(...diffColor),

			// Provide luminane characters for terminals that
			// may not have good (or any) color support
			char: grad[parseInt(((grad.length-1) / 100) * l)]
		}
	})

	const passed = imagesDidFuzzyMatch(maxDiff)
	outputStatus(passed, maxDiff, opts)
	outputScorecard(channelDiff, opts)
	outputVisualDiff(visualDiff, opts)


	if (opts.showExpected) {
		const columns = opts.showExpectedWidth === 'max' ?
			process.stdout.columns : opts.showExpectedWidth
		const title = chalk.yellow.underline('Expected'.padEnd(columns, ' ') + '\n')
		imageToTerminal(title, image1, columns, grad)
	}

	if (opts.showActual) {
		const columns = opts.showActualWidth === 'max' ?
			process.stdout.columns : opts.showActualWidth
		const title = chalk.yellow.underline('Actual'.padEnd(columns, ' ') + '\n')
		imageToTerminal(title, image2, columns, grad)
	}

	return passed
}

const imageToTerminal = (title, img, columns, grad) => {
	const imgWidth = img.shape[0]
	const imgHeight = img.shape[1]
	const u = 1 / columns * imgWidth

	console.log(title)

	let termOutput = ''

	for (let y = 0; y < imgHeight; y += u) {
		for (let x = 0; x < imgWidth; x += u) {
			const idx = (
					(imgWidth * parseInt(y)
				) + parseInt(x)
			) << 2

			if (idx + 4 <= img.data.length) {
				const r = img.data[idx]
				const g = img.data[idx + 1]
				const b = img.data[idx + 2]
				const l = color({r, g, b}).hsl().color[2]
				const d = chalk.bgRgb(r, g, b).rgb(r, g, b)
				const c = grad[parseInt(((grad.length-1) / 100) * l)]
				termOutput += d(c)
			}
		}
		termOutput += '\n'
	}

	console.log(termOutput)
}
// THE SAME FILE
// const expected = './fixtures/local-wish-command.png'
// const actual = './fixtures/local-wish-command.png'

// // THE SAME GRAPHIC RENDERED ON 2 DIFFERENT MACHINES
// const expected = './fixtures/local-wish-command.png'
// const actual = './fixtures/server-wish-command.png'

// // THE SAME GRAPHIC AT DIFFERENT SIZES
// const expected = './fixtures/local-wish-command-sml.png'
// const actual = './fixtures/local-wish-command.png'

// VERY DIFFERENT IMAGES
// const expected = './fixtures/emojis.png'
// const actual = './fixtures/iterm2colors-file.png'


// const expected = './fixtures/server-wish-command.png'
// const actual = './fixtures/iterm2colors-file.png'

// const expected = './fixtures/local-wish-command.png'
// const actual = './fixtures/iterm2colors-file.png'

// const actual = './fixtures/emojis.png'

// const expected = './fixtures/IMG_20180401_134432.jpg'
// const actual = './fixtures/IMG_20180401_134435.jpg'

const defaultOpts = {
	grid: {
		columns: 32,
		rows: 16
	},
	tolerance: {
	    hue: 0,
	    sat: 0,
	    lum: 0,
	    alp: 0
	},
	showExpected: true,
	showExpectedWidth: 32,
	// showExpectedWidth: 'max',
	showActual: true,
	showActualWidth: 32,
	// showActualWidth: 'max',
}


const fuzzyMatch = (imgPath1, imgPath2, opts) => {
	opts = deepmerge(defaultOpts, opts)
	return compare(imgPath1, imgPath2, opts)
}

module.exports = fuzzyMatch
