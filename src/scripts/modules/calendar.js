var ipc = electronRequire('ipc')
var calendar = electronRequire('node-calendar')
var $ = electronRequire('jquery-browserify')

var currentMonth = 1,
	currentYear = 1969,
	today = new Date(),
	$calendarView,
	$monthLabel

$(document).ready(function () {
	var $btnNavPrevMonth = $('#btn-navigate-prev-month'),
		$btnNavCurrentMonth = $('#btn-navigate-current-month'),
		$btnNavNextMonth = $('#btn-navigate-next-month'),
		$btnSettings = $('#btn-settings')

	initCalendar()

	// Clicking the previous, current, or next month button
	$btnNavPrevMonth.click(fetchPrevMonth)
	$btnNavCurrentMonth.click(fetchCurrentMonth)
	$btnNavNextMonth.click(fetchNextMonth)

	// Clicking the settings button
	$btnSettings.click(function () {
		var reply = ipc.sendSync('uiMessage', 'clickedSettingsBtn')
		console.log('reply', reply)
	})
})

return

function initCalendar() {
	$calendarView = $('#calendar-view')
	$monthLabel = $('#month-label')

	buildWeekdayLabels()
	fetchCurrentMonth()
}

function buildWeekdayLabels() {
	$weekdays = $('<div class="calendar-weekdays"></div>')

	// Rearrange the days so Sunday comes first
	var day_names = calendar.day_abbr
	day_names.unshift(day_names.pop())

	// Add each day to the list
	day_names.forEach(function (dayName) {
		$currentDay = $('<div>' + dayName + '</div>')

		$weekdays.append($currentDay)
	})

	$calendarView.append($weekdays)
}

function fetchPrevMonth() {
	currentMonth -= 1

	// Wrap around to December of the previous year
	if (currentMonth < 1) {
		currentMonth = 12
		currentYear -= 1
	}

	fetchCalendar(currentMonth, currentYear)
}

function fetchCurrentMonth() {
	currentMonth = today.getMonth() + 1,
	currentYear = today.getFullYear()
	fetchCalendar(currentMonth, currentYear)
}

function fetchNextMonth() {
	currentMonth += 1

	// Wrap around to January of the next year
	if (currentMonth > 12) {
		currentMonth = 1
		currentYear += 1
	}

	fetchCalendar(currentMonth, currentYear)
}

function fetchCalendar(month, year) {
	var monthData = new calendar.Calendar(calendar.SUNDAY).monthdatescalendar(year, month),
		currentMonth = today.getMonth() + 1,
		currentDay = today.getDate(),
		monthName = calendar.month_name[month]

	$calendarView.find('.calendar-week').remove()

	monthData.forEach(function (week) {
		var $currentMonth = $('<div class="calendar-week"></div>')

		week.forEach(function (day) {
			var thisMonth = day.getMonth() + 1,
				thisDay = day.getDate(),
				$currentDay = $('<div>' + thisDay + '</div>')

			// If the day is outside of the requested month
			if (thisMonth != month)
				$currentDay.addClass('outside-month')

			// If this is today
			if ((thisMonth == currentMonth) && (thisDay == currentDay))
				$currentDay.addClass('today')

			$currentMonth.append($currentDay)
		})

		$calendarView.append($currentMonth)

		$monthLabel.text(monthName + ' ' + year)
	})
}
