const getPixels = require('get-pixels')
const color = require('color')
const chalk = require('chalk')
const chromafi = require('chromafi')

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
		{s: stat(img, square.c)}
	))



const compare = async (img1, img2, opts) => {
	const image1 = await loadPixels(img1)
	const image2 = await loadPixels(img2)

	const [w1, h1] = image1.shape
	const [w2, h2] = image2.shape

	const grid1 = makeGrid(w1, h1, opts)
	const grid2 = makeGrid(w2, h2, opts)

	const size = opts.grid.columns * opts.grid.rows
	const diffHue = Array(size).fill(0)
	const diffSat = Array(size).fill(0)
	const diffLum = Array(size).fill(0)
	const diffAll = Array(size).fill(0)
	const diffClr = Array(size).fill(0)
	const diffAlp = Array(size).fill(0)

	const gridStat1 = statGridSquares(image1, grid1)
	const gridStat2 = statGridSquares(image2, grid2)

	let maxHueDiff = 0
	let maxSatDiff = 0
	let maxLumDiff = 0
	let maxAlpDiff = 0

	const grad = ' ░▒▓█'

	gridStat1.forEach((square, i) => {
		const hueDiff = square.s.hue - gridStat2[i].s.hue
		if (hueDiff > opts.tolerance.hue) {
			diffHue[i] += 1
			diffAll[i] += 1

			if (hueDiff > maxHueDiff) {
				maxHueDiff = hueDiff
			}
		}

		const satDiff = square.s.sat - gridStat2[i].s.sat
		if (satDiff > opts.tolerance.sat) {
			diffSat[i] += 1
			diffAll[i] += 1

			if (satDiff > maxSatDiff) {
				maxSatDiff = satDiff
			}
		}

		const lumDiff = square.s.lum - gridStat2[i].s.lum
		if (lumDiff > opts.tolerance.lum) {
			diffLum[i] += 1
			diffAll[i] += 1

			if (lumDiff > maxLumDiff) {
				maxLumDiff = lumDiff
			}
		}

		const alpDiff = square.s.a - gridStat2[i].s.a
		if (alpDiff > opts.tolerance.alpha) {
			diffAlp[i] += 1
			diffAll[i] += 1

			if (alpDiff > maxAlpDiff) {
				maxalpDiff = alpDiff
			}
		}

		const h = parseInt((360 / maxHueDiff) * hueDiff || 1)
		const s = parseInt((100 / maxSatDiff) * satDiff || 1)
		const l = parseInt((100 / maxLumDiff) * lumDiff || 1)

		const diffCol = color({h, s, l})
			.rgb().color.map(c => parseInt(c))

		diffClr[i] = {
			col: chalk.bgRgb(...diffCol).rgb(...diffCol),
			char: grad[parseInt(((grad.length-1) / 100) * l)]
		}
	})

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


	console.log()
	let flagOutput = ''
	for (let y = 0; y < opts.grid.rows; y++) {
		for (let x = 0; x < opts.grid.columns; x++) {
			const n = y * (opts.grid.columns) + x
			let b = ''
			b += diffHue[n] ? 'H' : '_'
			b += diffSat[n] ? 'S' : '_'
			b += diffLum[n] ? 'L' : '_'
			b += diffAlp[n] ? 'A' : '_'
			const bChar = bMap[b] || ''

			if (bChar) {
				flagOutput += chalk.bgRedBright.bold.black(bChar)
			} else {
				flagOutput += chalk.bgGreen(' ')
			}
		}
		flagOutput += '\n'
	}
	console.log(flagOutput)

	const toleranceDiff = {
		hue: maxHueDiff,
		sat: maxSatDiff,
		lum: maxLumDiff,
		alp: maxAlpDiff
	}

	console.log(chalk.magenta('Actual difference in tolerance:'))
	console.log(chalk.italic.gray('(Use these values in opts.tolerance to pass the test.)'))
	console.log(chromafi(toleranceDiff, {
		lineNumbers: false,
		codePad: 0
	}))

	console.log()
	let diffOutput = ''
	while (diffClr.length > 0) {
		const row = diffClr.splice(0, opts.grid.columns)
		row.forEach(d => {
			diffOutput += d.col(d.char)
		})
		diffOutput += '\n'
	}
	console.log(diffOutput)

	if (opts.showExpected) {
		console.log()
		console.log('Expected')
		let output = ''
		const sz = 1 / process.stdout.columns * image1.shape[0]
		for (let y = 0; y < image1.shape[1]; y += sz) {
			for (let x = 0; x < image1.shape[0]; x += sz) {
				const idx = ((image1.shape[0] * parseInt(y)) + parseInt(x)) << 2
				if (idx + 4 <= image1.data.length) {
					const r = image1.data[idx]
					const g = image1.data[idx + 1]
					const b = image1.data[idx + 2]
					const d = chalk.bgRgb(r, g, b)
					output += d(' ')
				}
			}
		}
		console.log(output)
	}

	if (opts.showActual) {
		console.log()
		console.log('Actual')
		let output2 = ''
		const sz2 = 1 / process.stdout.columns * image2.shape[0]
		for (let y = 0; y < image2.shape[1]; y += sz2) {
			for (let x = 0; x < image2.shape[0]; x += sz2) {
				const idx = ((image2.shape[0] * parseInt(y)) + parseInt(x)) << 2
				if (idx + 4 <= image2.data.length) {
					const r = image2.data[idx]
					const g = image2.data[idx + 1]
					const b = image2.data[idx + 2]
					const d = chalk.bgRgb(r, g, b)
					output2 += d(' ')
				}
			}
		}
		console.log(output2)
	}
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
const expected = './fixtures/emojis.png'
const actual = './fixtures/iterm2colors-file.png'


// const expected = './fixtures/server-wish-command.png'
// const actual = './fixtures/iterm2colors-file.png'

// const expected = './fixtures/local-wish-command.png'
// const actual = './fixtures/iterm2colors-file.png'

// const actual = './fixtures/emojis.png'

// const expected = './fixtures/IMG_20180401_134432.jpg'
// const actual = './fixtures/IMG_20180401_134435.jpg'

const opts = {
	grid: {
		columns: 32,
		rows: 16
	},
	tolerance: {
	    hue: 0,
	    sat: 0,
	    lum: 0,
	    alp: 0
	}
}

compare(expected, actual, opts)
