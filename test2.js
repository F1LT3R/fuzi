const getPixels = require('get-pixels')
const color = require('color')

const loadPixels = path => new Promise((resolve, reject) => {
	getPixels(path, function(err, pixels) {
		if (err) {
			return reject(err)
		}
		resolve(pixels)
	})
})

const projected = (x, y) {

}

const stat = (img1, img2, quad) => {
	const [x1, y1, x2, y2] = quad
	const [w1, h1] = img1.shape
	const [w2, h2] = img2.shape

	const xRatio = w1 / w2
	const yRatio = h1 / h2
	console.log(`ratio = ${xRatio}:${yRatio}`)

	const count1 = {
		r: 0,
		b: 0,
		g: 0,
		a: 0,
		l: 0
	}

	const count2 = {
		r: 0,
		b: 0,
		g: 0,
		a: 0,
		l: 0
	}

	const totalPixels = (x2 - x1) * (y2 - y1)

	for (let y = y1; y < y2; y++) {
		for (let x = x1; x < x2; x++) {
			const idx = ((w1 * y) + x) << 2
			count1.r += img1.data[idx]
			count1.g += img1.data[idx + 1]
			count1.b += img1.data[idx + 2]
			count1.a += img1.data[idx + 3]

			const idx2 = Math.floor((((w1 * xRatio) * (y * yRatio)) + (x * xRatio))) << 2
			count2.r += img2.data[idx2]
			count2.g += img2.data[idx2 + 1]
			count2.b += img2.data[idx2 + 2]
			count2.a += img2.data[idx2 + 3]
		}
	}

	console.log(count1)
	console.log(count2)

	const stat1 = {
		r: (count1.r / totalPixels) / 4,
		b: (count1.g / totalPixels) / 4,
		g: (count1.b / totalPixels) / 4,
		a: (count1.a / totalPixels) / 4,
		l: ((count1.r + count1.g + count1.b) / 3) / totalPixels
	}

	const stat2 = {
		r: (count2.r / totalPixels) / 4,
		b: (count2.g / totalPixels) / 4,
		g: (count2.b / totalPixels) / 4,
		a: (count2.a / totalPixels) / 4,
		l: ((count2.r + count2.g + count2.b) / 3) / (totalPixels)
	}

	console.log(stat1)
	console.log(stat2)


	// return stat
}

const compare = async (img1, img2) => {
	const image1 = await loadPixels(img1)
	const image2 = await loadPixels(img2)

	const quad = [0, 0, 200, 20]

	const colStat = stat(image1, image2, quad)

	// const col1 = color({
	// 	r: colorStat1.r,
	// 	g: colorStat1.g,
	// 	b: colorStat1.b
	// }).hsl()
	// console.log(col1)

	// const col2 = color({
	// 	r: colorStat2.r,
	// 	g: colorStat2.g,
	// 	b: colorStat2.b
	// }).hsl()
	// console.log(col2)
}

const expected = './fixtures/local-wish-command.png'
// const actual = './fixtures/local-wish-command-sml.png'
const actual = './fixtures/server-wish-command.png'

// const expected = './fixtures/local-wish-command.png'
// const actual = './fixtures/emojis.png'

compare(expected, actual)
