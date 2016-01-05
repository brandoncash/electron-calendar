var app = require('app')
var ipc = require('ipc')
var extend = require('extend')
var fs = require('fs')

var globalShortcut = require('global-shortcut')
var BrowserWindow = require('browser-window')
var menubar = require('menubar')

var moment = require('moment')

var settings = require('./options.json')
var default_settings = require('./options-default.json')
var viewDirectory = 'file://' + app.getAppPath() + '/view'
var needsToSave = false

var settingsWindow = null
var updateTimer = null // FIXME: why does standard not like this var?
var previousDay = null
var mb_options

updateMenubarOptions()

var mb = menubar(mb_options)

mb.on('ready', function ready () {
  // Set up the menu bar
  mb.tray.setPressedImage('icons/calendar-white.png')
  mb.tray.setHighlightMode(true)

  if (settings.menubar.showDate) {
    updateMenubarText()
  }

  attachWindowEvents()

  updateIcon(settings.menubar.iconType)

  updateTimer = setInterval(updateLoop, 1000)

  resetGlobalShortcutKeys()

  ipc.on('settings.fetch', function (event) { event.returnValue = settings })
  ipc.on('settings.windowReady', function (event) {
    settingsWindow.show()
    event.returnValue = true
  })

  ipc.on('uiMessage.main', uiListener)
})

// TODO: REFACTOR: instead of a big switch/case, just assign one for each event?
function uiListener (event, message, arg1) {
  var response = false

  switch (message) {
    case 'selectIconType':
      response = selectIconType(arg1)
      break
    case 'settings.toggleShowDate':
      response = toggleShowDate(arg1)
      break
    case 'getDateFormat':
      response = settings.menubar.dateFormat
      break
    case 'setDateFormat':
      response = setDateFormat(arg1)
      break
    case 'getGlobalShortcutKeys':
      response = settings.globalShortcutKeys
      break
    case 'setGlobalShortcutKeys':
      response = setGlobalShortcutKeys(arg1)
      break
    case 'settings.setWindowSize':
      response = setWindowSize(arg1)
      break
    case 'settings.toggleRememberSize':
      response = toggleRememberSize(arg1)
      break
    case 'settings.toggleRememberPosition':
      response = toggleRememberPosition(arg1)
      break
    case 'settings.toggleAlwaysOnTop':
      response = toggleAlwaysOnTop(arg1)
      break
    case 'settings.setBackgroundColor':
      response = setBackgroundColor(arg1)
      break
    case 'settings.toggleWindowTransparency':
      response = toggleWindowTransparency(arg1)
      break
    case 'settings.setWindowTransparencyAmount':
      response = setWindowTransparencyAmount(arg1)
      break
    case 'calendar.fetchWindowTransparencyOptions':
      response = fetchWindowTransparencyOptions()
      break
    case 'calendarUI.clickedCloseBtn':
      response = clickCalendarCloseBtn()
      break
    case 'calendarUI.clickedOpenSettingsBtn':
      response = clickOpenSettingsBtn()
      break
    case 'settingsUI.clickedSettingsResetBtn':
      response = clickSettingsResetBtn()
      break
    case 'settingsUI.clickedSettingsOkayBtn':
      response = clickSettingsOkayBtn()
      break
  }

  event.returnValue = response
}

function updateMenubarOptions () {
  mb_options = {
    'icon': 'icons/calendar.png',
    'always-on-top': settings.window.alwaysOnTop,
    'preloadWindow': true,
    'width': settings.window.width,
    'height': settings.window.height,
    'min-width': 240,
    'min-height': 200,
    'index': viewDirectory + '/calendar.html',
    'frame': false,
    'transparent': settings.window.transparencyActive
  }

  if (settings.window.rememberPosition) {
    mb_options.x = settings.window.x
    mb_options.y = settings.window.y
  }

  return mb_options
}

function updateLoop () {
  var date = new Date()
  var thisDay = date.getDay()

  // Refresh the icon every day
  if (thisDay !== previousDay) {
    updateIcon(settings.menubar.iconType)
  }

  previousDay = thisDay

  // See if we need to save
  if (needsToSave) {
    writeOptions()
  }

  if (settings.menubar.showDate) {
    updateMenubarText()
  }
}

function updateMenubarText () {
  var dateString = getDateString()
  mb.tray.setTitle(dateString)
}

function getDateString () {
  var dateString = moment().format(settings.menubar.dateFormat)

  return dateString
}

function recreateWindow () {
  mb.window.removeAllListeners()
  mb.removeAllListeners()
  mb.window.close()
  mb.window = false
  mb.showWindow()
  attachWindowEvents()
}

function attachWindowEvents () {
  mb.window.on('close', function () {
    mb.window.removeAllListeners()
    mb.removeAllListeners()
  })

  mb.window.on('blur', function () {
    if (!settings.window.alwaysOnTop) {
      mb.hideWindow()
    }
  })

  mb.window.on('move', function () {
    if (!settings.window.rememberPosition) {
      return
    }

    var windowBounds = mb.window.getBounds()

    settings.window.x = windowBounds.x
    settings.window.y = windowBounds.y
    extend(mb_options, windowBounds)
    needsToSave = true
  })

  mb.window.on('resize', function () {
    if (!settings.window.rememberSize) {
      return
    }

    var windowBounds = mb.window.getSize()
    var new_width = windowBounds[0]
    var new_height = windowBounds[1]

    mb_options.width = new_width
    mb_options.height = new_height
    settings.window.width = new_width
    settings.window.height = new_height
    needsToSave = true

    if (settingsWindow !== null) {
      settingsWindow.webContents.send('settings.updateBounds', windowBounds)
    }
  })

  mb.on('after-hide', function () {
    if (!settings.window.rememberPosition) {
      mb.window.setPosition(settings.window.x, settings.window.y)
    }

    if (!settings.window.rememberSize) {
      mb.window.setSize(settings.window.width, settings.window.height)
    }
  })
}

function createSettingsWindow () {
  var settingsWindowConfig = {
    width: 500,
    height: 400,
    resizable: false,
    show: false,
    frame: false,
    'always-on-top': true
  }

  settingsWindow = new BrowserWindow(settingsWindowConfig)
  settingsWindow.loadUrl(viewDirectory + '/settings.html')

  settingsWindow.on('close', function () {
    settingsWindow.removeAllListeners()
    settingsWindow = null
  })
}

// Options
// ---------

// Reset the options to default
function resetOptions () {
  // FIXME: strange things are afoot at the Circle K
  settings = default_settings
  console.log('resetOptions ' + settings.menubar.iconType)
  console.log('resetOptions ' + default_settings.menubar.iconType)
  needsToSave = true
  // writeOptions()
}

// Save the options to disk
function writeOptions () {
  needsToSave = false
  fs.writeFile('options.json', JSON.stringify(settings, null, 2), 'utf8')
}

// Show Date
// ----------

function toggleShowDate (isChecked) {
  settings.menubar.showDate = isChecked
  needsToSave = true

  if (!isChecked) {
    mb.tray.setTitle('')
  } else {
    updateMenubarText()
  }

  return true
}

// Date format
// ------------

function setDateFormat (new_format) {
  settings.menubar.dateFormat = new_format
  updateMenubarText()

  return true
}

// Setting the icon
// -----------------

function selectIconType (which_icon) {
  updateIcon(which_icon)
  settings.menubar.iconType = which_icon
  needsToSave = true

  return true
}

function updateIcon (which) {
  switch (which) {
    case 'calendar-date':
      updateIconCalendarDate()
      break
    case 'filledcalendar-date':
      updateIconCalendarDate('filled')
      break
    case 'fatcalendar-date':
      updateIconCalendarDate('fat')
      break
    case 'calendar-weekday':
      updateIconCalendarWeekday()
      break
    case 'filledcalendar-weekday':
      updateIconCalendarWeekday('filled')
      break
    case 'fatcalendar-weekday':
      updateIconCalendarWeekday('fat')
      break
  }
}

function updateIconCalendarDate (variation) {
  variation = variation || ''
  var date = parseInt(moment().format('D'), 10) // The day of the month
  var iconName = variation + 'calendar-date-' + date

  mb.tray.setImage('icons/' + iconName + '.png')
  mb.tray.setPressedImage('icons/' + iconName + '-white.png')
}

function updateIconCalendarWeekday (variation) {
  variation = variation || ''
  var weekday = moment().format('dddd').toLowerCase() // sunday, monday, etc.
  var iconName = variation + 'calendar-weekday-' + weekday

  mb.tray.setImage('icons/' + iconName + '.png')
  mb.tray.setPressedImage('icons/' + iconName + '-white.png')
}

// Hotkeys
// --------

// Reset the hotkeys
function resetGlobalShortcutKeys () {
  globalShortcut.unregisterAll()
  globalShortcut.register(getGlobalShortcutKeysString(), pressedGlobalShortcutKeys)
}

// Update the hotkeys
function setGlobalShortcutKeys (new_keys) {
  settings.globalShortcutKeys = new_keys
  resetGlobalShortcutKeys()
  needsToSave = true

  return true
}

// Construct the string for the hotkey
function getGlobalShortcutKeysString () {
  var keys_string = ''

  if (settings.globalShortcutKeys.alt) {
    keys_string += 'Alt+'
  }
  if (settings.globalShortcutKeys.command) {
    keys_string += 'Command+'
  }
  if (settings.globalShortcutKeys.control) {
    keys_string += 'Control+'
  }
  if (settings.globalShortcutKeys.shift) {
    keys_string += 'Shift+'
  }
  keys_string += settings.globalShortcutKeys.key

  return keys_string
}

// When the hotkeys are pressed, toggle the window visiblity
function pressedGlobalShortcutKeys () {
  if (!mb.window.isVisible()) {
    mb.window.show()
  } else {
    mb.hideWindow()
  }
}

// Window width / height
// ----------------------
function setWindowSize (new_size) {
  var new_width = new_size.width
  var new_height = new_size.height

  settings.window.width = new_width
  settings.window.height = new_height

  mb.window.setSize(new_width, new_height)
  needsToSave = true

  return true
}

// Remember size
// ------------------

function toggleRememberSize (isChecked) {
  settings.window.rememberSize = isChecked
  needsToSave = true

  return true
}

// Remember position
// ------------------

function toggleRememberPosition (isChecked) {
  settings.window.rememberPosition = isChecked
  needsToSave = true

  return true
}

// Always on top
// --------------

// Toggle whether the calendar window is always on top
function toggleAlwaysOnTop (isChecked) {
  settings.window.alwaysOnTop = isChecked
  mb_options['always-on-top'] = isChecked
  mb.setOption('always-on-top', isChecked)
  mb.window.setAlwaysOnTop(isChecked)
  needsToSave = true

  return true
}

// Background color
// -----------------

function setBackgroundColor (new_color) {
  new_color = new_color.substring(1, 7) // Remove the leading octothorpe
  settings.window.backgroundColor = new_color
  mb.window.webContents.send('calendar.setBackgroundColor', new_color)
  needsToSave = true

  return true
}

// Window transparency
// --------------------

// Toggle window transparency - recreates the window to toggle the transparent flag
function toggleWindowTransparency (isChecked) {
  var windowBounds = null
  settings.window.transparencyActive = isChecked
  mb_options.transparent = isChecked
  mb.setOption('transparent', isChecked)

  windowBounds = mb.window.getBounds()
  extend(mb_options, windowBounds)

  recreateWindow()
  attachWindowEvents()
  needsToSave = true

  return true
}

// Sets how much transparency the window will have
function setWindowTransparencyAmount (percentage) {
  settings.window.transparencyAmount = parseInt(percentage, 10)
  mb.window.webContents.send('calendar.setWindowTransparencyAmount', percentage)
  needsToSave = true

  return true
}

// Fetch the window's transparency amount
function fetchWindowTransparencyOptions () {
  var transparency_options = {
    active: settings.window.transparencyActive,
    amount: settings.window.transparencyAmount
  }

  return transparency_options
}

// Settings UI controls
// ---------------------

// Clicking the reset button
function clickSettingsResetBtn () {
  resetOptions()

  return true
}

// Clicking the okay button in the settings panel
function clickSettingsOkayBtn () {
  settingsWindow.close()
  writeOptions()

  return true
}

// Calendar UI controls
// ---------------------

function clickCalendarCloseBtn () {
  mb.window.hide()

  return true
}

// Clicking the settings cog button - toggle the settings window visibility
function clickOpenSettingsBtn () {
  if (settingsWindow === null) {
    createSettingsWindow()
  } else {
    settingsWindow.close()
  }

  return true
}
