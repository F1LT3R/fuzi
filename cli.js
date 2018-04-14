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
	  --scorecard, -c  Show Scorecard.
	  --visualDiff, -d  Show visual diff.
	  --showImages, -i  Show original images in terminal. (true/columns)
	  --details, -d  Display more detailed results.
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
		showImages: {
			type: 'string',
			alias: 'i'
		},
		details: {
			type: 'boolean',
			alias: 'd'
		}
	}
}

const meowCli = meow(meowStr, meowOpts)

const opts = defaultOpts

const [expectedImg, actualImg] = meowCli.input

const hueTolCli = meowCli.flags.h
const satTolCli = meowCli.flags.s
const lumTolCli = meowCli.flags.l
const alpTolCli = meowCli.flags.a

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
if (typeof meowCli.flags.i === 'string' || meowCli.flags.e) {
	opts.display.images = meowCli.flags.i || true
}
if (meowCli.flags.v || meowCli.flags.e) {
	opts.display.visualDiff = true
}
if (meowCli.flags.c || meowCli.flags.e) {
	opts.display.scorecard = true
}
if (meowCli.flags.d || meowCli.flags.e) {
	opts.display.details = true
}

// Force result to display in CLI mode
opts.display.result = true

fuzi(expectedImg, actualImg, opts)
