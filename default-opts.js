const defaultOpts = {
	cli: {
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
		display: {
			mark: true,
			pretty: false,
			scorecard: false,
			grid: false,
			channelDiff: false,
			visualDiff: false,
			images: false
		}
	},

	api: {
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
		display: {
			mark: true,
			pretty: true,
			scorecard: true,
			grid: true,
			channelDiff: true,
			visualDiff: true,
			images: 32
		}
	}
}

module.exports = defaultOpts
