const getPixels = require('get-pixels')
const color = require('color')
const chalk = require('chalk')

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
		r: parseInt(stat.r, 10),
		g: parseInt(stat.g, 10),
		b: parseInt(stat.b, 10)
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

	const gridStat1 = statGridSquares(image1, grid1)
	const gridStat2 = statGridSquares(image2, grid2)

	gridStat1.forEach((square, i) => {
		const hueDiff = square.s.hue - gridStat2[i].s.hue
		if (hueDiff > opts.tolerance.hue) {
			diffHue[i] += 1
			diffAll[i] += 1
		}

		const satDiff = square.s.sat - gridStat2[i].s.sat
		if (satDiff > opts.tolerance.sat) {
			diffSat[i] += 1
			diffAll[i] += 1
		}

		const lumDiff = square.s.lum - gridStat2[i].s.lum
		if (satDiff > opts.tolerance.lum) {
			diffLum[i] += 1
			diffAll[i] += 1
		}

		const diffCol = color({
			h: parseInt(hueDiff),
			s: parseInt(satDiff),
			l: parseInt(lumDiff),
		}).rgb().color
		diffClr[i] = chalk.rgb(...diffCol)
	})

	// while (diffHue.length > 0) {
	// 	const row = diffHue.splice(0, opts.grid.columns)
	// 	row.forEach(d => {
	// 		if (d) {
	// 			process.stdout.write(chalk.redBright('█'))
	// 		} else {
	// 			process.stdout.write(chalk.green('░'))
	// 		}
	// 	})
	// 	process.stdout.write('\n')
	// }

	// console.log()
	// while (diffSat.length > 0) {
	// 	const row = diffSat.splice(0, opts.grid.columns)
	// 	row.forEach(d => {
	// 		if (d) {
	// 			process.stdout.write(chalk.redBright('█'))
	// 		} else {
	// 			process.stdout.write(chalk.green('░'))
	// 		}
	// 	})
	// 	process.stdout.write('\n')
	// }

	// console.log()
	// while (diffLum.length > 0) {
	// 	const row = diffLum.splice(0, opts.grid.columns)
	// 	row.forEach(d => {
	// 		if (d) {
	// 			process.stdout.write(chalk.redBright('█'))
	// 		} else {
	// 			process.stdout.write(chalk.green('░'))
	// 		}
	// 	})
	// 	process.stdout.write('\n')
	// }

	console.log()
	while (diffAll.length > 0) {
		const row = diffAll.splice(0, opts.grid.columns)
		row.forEach(d => {
			if (d) {
				process.stdout.write(chalk.redBright('█'))
			} else {
				process.stdout.write(chalk.green('░'))
			}
		})
		process.stdout.write('\n')
	}

	console.log()
	while (diffClr.length > 0) {
		const row = diffClr.splice(0, opts.grid.columns)
		row.forEach(d => {
			process.stdout.write(d('█'))
		})
		process.stdout.write('\n')
	}

	const sz = 8
	for (let y = 0; y < image1.shape[1]; y += sz) {
		for (let x = 0; x < image1.shape[0]; x += sz) {
			const idx = ((image1.shape[0] * y) + x) << 2
			if (idx + 4 <= image1.data.length) {
				const r = image1.data[idx]
				const g = image1.data[idx + 1]
				const b = image1.data[idx + 2]
				const a = image1.data[idx + 3]
				const d = chalk.rgb(r, g, b)
				process.stdout.write(d('█'))
			}
		}
		process.stdout.write('\n')
	}



	// diff.forEach((mark, i) => {
	// 	if (mark > 0) {

	// 	}

	// })

	// console.log(gridStat1.map(n => [
	// 	n.s.hue.toFixed(0).padStart(3),
	// 	n.s.lum.toFixed(0).padStart(3),
	// 	n.s.sat.toFixed(0).padStart(3),
	// ]))
	// console.log(gridStat2.map(n => [
	// 	n.s.hue.toFixed(0).padStart(3),
	// 	n.s.lum.toFixed(0).padStart(3),
	// 	n.s.sat.toFixed(0).padStart(3),
	// ]))

}

const expected = './fixtures/local-wish-command.png'
const actual = './fixtures/server-wish-command.png'

// const expected = './fixtures/local-wish-command-sml.png'
// const actual = './fixtures/local-wish-command.png'

// const expected = './fixtures/server-wish-command.png'
// const actual = './fixtures/iterm2colors-file.png'

// const expected = './fixtures/local-wish-command.png'
// const actual = './fixtures/iterm2colors-file.png'

// const expected = './fixtures/emojis.png'
// const actual = './fixtures/iterm2colors-file.png'
// const actual = './fixtures/emojis.png'

// const expected = './fixtures/IMG_20180401_134432.jpg'
// const actual = './fixtures/IMG_20180401_134435.jpg'

const opts = {
	grid: {
		columns: 16,
		rows: 8
	},
	tolerance: {
		hue: 5,
		sat: 30,
		lum: 1000
	}
}

compare(expected, actual, opts)
