#!/usr/bin/env node
const meow = require('meow')
const defaultOpts = require('./default-opts.js')
const fuzi = require('.')

const meowStr = `
	Usage
	  $ fuzzymatch <expectedImg> <actualImg> [options]

	Options
	  --hue, -h  Hue tolerance. (0 - 360)
	  --sat, -s  Saturation tolerance. (0 - 100)
	  --lum, -l  Luminance tolerance. (0 - 100)
	  --alp, -a  Alpha tolerance. (0 - 100)
	  --rows, -r  Grid rows.
	  --columns, -c  Grid rows.
	  --scorecard, -d  Show Scorecard.
	  --visualDiff, -v  Show visual diff.
	  --showImages, -i  Show original images in terminal. (true/columns)
	  --pretty, -p  Display pretty tolerance results.
	  --everything, -e  Display everything.

	Examples
	  $ fuzzymatch a.png b.jpg -s 50 -i
`
const meowOpts = {
	flags: {
		hue: {
			type: 'number',
			alias: 'h'
		},
		sat: {
			type: 'number',
			alias: 's'
		},
		lum: {
			type: 'number',
			alias: 'l'
		},
		alp: {
			type: 'number',
			alias: 'a'
		},
		rows: {
			type: 'number',
			alias: 'r'
		},
		columns: {
			type: 'number',
			alias: 'c'
		},
		showImages: {
			type: 'string',
			alias: 'i'
		},
		pretty: {
			type: 'boolean',
			alias: 'p'
		}
	}
}

const meowCli = meow(meowStr, meowOpts)

const opts = defaultOpts.cli

const [expectedImg, actualImg] = meowCli.input

const hueTolCli = meowCli.flags.h
const satTolCli = meowCli.flags.s
const lumTolCli = meowCli.flags.l
const alpTolCli = meowCli.flags.a
const columnsCli = meowCli.flags.c
const rowsCli = meowCli.flags.r

if (hueTolCli) {
	opts.tolerance.hue = hueTolCli
}
if (satTolCli) {
	opts.tolerance.sat = satTolCli
}
if (lumTolCli) {
	opts.tolerance.lum = lumTolCli
}
if (alpTolCli) {
	opts.tolerance.alp = alpTolCli
}
if (columnsCli) {
	opts.grid.columns = columnsCli
}
if (rowsCli) {
	opts.grid.rows = rowsCli
}

const defaultImgWidth = 32
if (typeof meowCli.flags.i === 'string' || meowCli.flags.e) {
	opts.display.images = meowCli.flags.i || defaultImgWidth
}
if (meowCli.flags.v || meowCli.flags.e) {
	opts.display.visualDiff = true
}
if (meowCli.flags.d || meowCli.flags.d) {
	opts.display.scorecard = true
}
if (meowCli.flags.p || meowCli.flags.p) {
	opts.display.pretty = true
}

// Force result to display in CLI mode
opts.errorLog = msg => {
	// eslint-disable-next-line no-console
	console.log(msg)
}

fuzi(expectedImg, actualImg, opts)
