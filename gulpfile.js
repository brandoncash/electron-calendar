// This file goes in root of your app

var gulp = require('gulp');
var eta = require('gulp-eta');
var config = {};

// Scaffold configuration
config.scaffold = {
	source: {
		root:     'src',
		images:   'images',
		scripts:  'scripts',
		sprites:  'sprites',
		styles:   'sass',
		symbols:  'symbols',
		static:   'static'
	},
	assets: {
		root:     'view/assets',
		images:   'images',
		sprites:  'images/sprites',
		scripts:  'scripts',
		styles:   'styles',
		symbols:  'fonts/symbols',
		static:   'static'
	}
};

config.browserify = {
	transform: ['browserify-shim']
};

eta(gulp, config);
