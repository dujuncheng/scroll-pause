module.exports = {
	env: {
		browser: true,
		node: true,
		es6: true,
	},
	root: true,
	parserOptions: {
		sourceType: 'module'
	},
	parser: "vue-eslint-parser",
	rules: {
		'no-multi-spaces': 0,
		'no-console': 0,
		'no-trailing-spaces': [2, { "skipBlankLines": true }],
		'no-tabs': 0,
		'vue/require-prop-type-constructor': 0,
		'max-len': 0,
	},
	"globals": {
		"process": true,
	},
};
