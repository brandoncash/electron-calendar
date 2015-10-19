require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"settings":[function(require,module,exports){
var ipc = electronRequire('ipc')
var $ = electronRequire('jquery-browserify')
var moment = electronRequire('moment')

var settings = {
		dateFormat: 'MMMM Do YYYY, h:mm:ss a'
	},
	$inputDateFormat,
	$outputDateFormat,
	$btnSettingsOkay,
	$checkAlwaysOnTop,
	$checkLaunchOnStartup

$(document).ready(function () {
	$inputDateFormat = $('#input-date-format')
	$outputDateFormat = $('#output-date-format span')
	$btnSettingsOkay = $('#btn-settings-okay')
	$checkAlwaysOnTop = $('#check-always-on-top')
	$checkLaunchOnStartup = $('#check-launch-on-startup')

	$inputDateFormat.val(settings.dateFormat);

	updateTimePreview()
	setInterval(updateTimePreview, 1000)

	$inputDateFormat.on('keyup', function(thing) {
		settings.dateFormat = $inputDateFormat.val()
		updateTimePreview()
	})

	// Clicking the settings button
	$btnSettingsOkay.click(function () {
		console.log('settings - clicked okay')
		var reply = ipc.sendSync('uiMessage', 'clickedSettingsOkayBtn')
	})
})

return

function updateTimePreview() {
	var dateString = moment().format(settings.dateFormat)
	$outputDateFormat.text(dateString)
}
},{}]},{},["settings"]);
