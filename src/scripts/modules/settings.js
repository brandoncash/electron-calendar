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