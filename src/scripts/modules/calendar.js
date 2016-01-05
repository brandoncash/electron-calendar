// A front-end require() is injected in the DOM
if (typeof electronRequire === 'undefined') {
  var electronRequire = require
}
var ipc = electronRequire('ipc')
var calendar = electronRequire('node-calendar')
var $ = electronRequire('jquery-browserify')

var currentMonth = 1
var currentYear = 1969
var today = new Date()
var $window
var $calendarView
var $monthLabel
var $yearLabel
var backgroundColor
var backgroundTransparency

ipc.on('calendar.toggleWindowTransparency', toggleWindowTransparency)
ipc.on('calendar.setBackgroundColor', setBackgroundColor)
ipc.on('calendar.setWindowTransparencyAmount', setWindowTransparencyAmount)

$(document).ready(function () {
  var $btnClose = $('#btn-close')
  var $btnOpenSettings = $('#btn-open-settings')
  var $btnNavPrevMonth = $('#btn-navigate-prev-month')
  var $btnNavCurrentMonth = $('#btn-navigate-current-month')
  var $btnNavNextMonth = $('#btn-navigate-next-month')

  $window = $('.window')

  initCalendar()

  $btnClose.click(clickCloseBtn)
  $btnOpenSettings.click(clickOpenSettingsBtn)

  // Clicking the previous, current, or next month button
  $btnNavPrevMonth.click(fetchPrevMonth)
  $btnNavCurrentMonth.click(fetchCurrentMonth)
  $btnNavNextMonth.click(fetchNextMonth)
})

function clickCloseBtn () {
  ipc.sendSync('uiMessage.main', 'calendarUI.clickedCloseBtn')
}

function clickOpenSettingsBtn () {
  ipc.sendSync('uiMessage.main', 'calendarUI.clickedOpenSettingsBtn')
}

function toggleWindowTransparency (isChecked) {
  // console.log('toggleWindowTransparency ' + isChecked)
  if (isChecked) {
    $window.addClass('has-transparency')
  } else {
    $window.removeClass('has-transparency')
  }

  updateWindowBackground()
}

function fetchCalendarSettings () {
  var settings = ipc.sendSync('settings.fetch')

  backgroundColor = settings.window.backgroundColor

  if (settings.window.transparencyActive) {
    setWindowTransparencyAmount(settings.window.transparencyAmount)
    toggleWindowTransparency(true)
  } else {
    toggleWindowTransparency(false)
  }

  updateWindowBackground()
}

function setBackgroundColor (new_color) {
  backgroundColor = new_color

  updateWindowBackground()
}

function setWindowTransparencyAmount (percentage) {
  // Convert number from percentage to (0..1)
  backgroundTransparency = percentage / 100

  updateWindowBackground()
}

function convertHexToRGB (hexColor) {
  var bigint = parseInt(hexColor, 16)
  var red = (bigint >> 16) & 255
  var green = (bigint >> 8) & 255
  var blue = bigint & 255
  var colorObject = {
    r: red,
    g: green,
    b: blue
  }

  return colorObject
}

function updateWindowBackground () {
  if ($window.hasClass('has-transparency')) {
    var rgbColor = convertHexToRGB(backgroundColor)
    $window.css('background-color', 'rgba(' + rgbColor.r + ',' + rgbColor.g + ',' + rgbColor.b + ',' + backgroundTransparency + ')')
  } else {
    $window.css('background-color', '#' + backgroundColor)
  }
}

function initCalendar () {
  $calendarView = $('#calendar-view')
  $monthLabel = $('#month-label')
  $yearLabel = $('#year-label')

  fetchCalendarSettings()
  updateWindowBackground()
  buildWeekdayLabels()
  fetchCurrentMonth()
}

function buildWeekdayLabels () {
  var $weekdays = $('<div class="calendar-weekdays"></div>')
  var $currentDay

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

function fetchPrevMonth () {
  currentMonth -= 1

  // Wrap around to December of the previous year
  if (currentMonth < 1) {
    currentMonth = 12
    currentYear -= 1
  }

  fetchCalendar(currentMonth, currentYear)
}

function fetchCurrentMonth () {
  currentMonth = today.getMonth() + 1
  currentYear = today.getFullYear()
  fetchCalendar(currentMonth, currentYear)
}

function fetchNextMonth () {
  currentMonth += 1

  // Wrap around to January of the next year
  if (currentMonth > 12) {
    currentMonth = 1
    currentYear += 1
  }

  fetchCalendar(currentMonth, currentYear)
}

function fetchCalendar (month, year) {
  var monthData = new calendar.Calendar(calendar.SUNDAY).monthdatescalendar(year, month)
  var currentMonth = today.getMonth() + 1
  var currentDay = today.getDate()
  var monthName = calendar.month_name[month]

  $calendarView.find('.calendar-week').remove()

  monthData.forEach(function (week) {
    var $currentWeek = $('<div class="calendar-week"></div>')
    var $outsideMonthDates

    week.forEach(function (day) {
      var thisMonth = day.getMonth() + 1
      var thisDay = day.getDate()
      var $currentDay = $('<div>' + thisDay + '</div>')

      // If the day is outside of the requested month
      if (thisMonth !== month) {
        $currentDay.addClass('outside-month')
      }

      // If this is today
      if ((thisMonth === currentMonth) && (thisDay === currentDay)) {
        $currentDay.addClass('today').wrapInner('<span></span>')
      }

      $currentWeek.append($currentDay)
    })

    // This allows for extra styling on the first and last of the outside month dates
    $outsideMonthDates = $currentWeek.find('.outside-month')
    $outsideMonthDates.first().addClass('first')
    $outsideMonthDates.last().addClass('last')

    $calendarView.append($currentWeek)

    $monthLabel.text(monthName)
    $yearLabel.text(year)
  })
}
