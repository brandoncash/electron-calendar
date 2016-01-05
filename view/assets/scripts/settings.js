require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"settings":[function(require,module,exports){
// A front-end require() is injected in the DOM
if (typeof electronRequire === 'undefined') {
  var electronRequire = require
}
var ipc = electronRequire('ipc')
var $ = electronRequire('jquery-browserify')
var electronOpenLinkInBrowser = electronRequire('electron-open-link-in-browser')

var settings = null
var globalShortcutKeys = null // TODO: remove and use settings above

var $btnSection
var $formPages

var $btnIconStyle
var $iconTypeDescription

var $checkShowDate
var $selectDateFormat
var $selectDateFormatOptions
var $inputDateFormat

var $inputGlobalShortcutKeys
var $btnShortcutModifierAlt
var $btnShortcutModifierCommand
var $btnShortcutModifierControl
var $btnShortcutModifierShift

var $inputWindowWidth
var $inputWindowHeight

var $checkRememberSize
var $checkRememberPosition
var $checkAlwaysOnTop

var $inputBackgroundColor
var $checkWindowTransparency
var $inputWindowTransparency

var $btnSettingsReset
var $btnSettingsOkay

$(document).ready(function () {
  $btnSection = $('.section-button')
  $formPages = $('.form-page')

  $btnIconStyle = $('.btn-icon-style')
  $iconTypeDescription = $('.icon-style p')

  $checkShowDate = $('#check-show-date')
  $selectDateFormat = $('#select-date-format')
  $selectDateFormatOptions = $selectDateFormat.find('option')
  $inputDateFormat = $('#input-date-format')

  $inputGlobalShortcutKeys = $('#input-global-shortcut-keys')
  $btnShortcutModifierAlt = $('#btn-shortcut-modifier-alt')
  $btnShortcutModifierCommand = $('#btn-shortcut-modifier-command')
  $btnShortcutModifierControl = $('#btn-shortcut-modifier-control')
  $btnShortcutModifierShift = $('#btn-shortcut-modifier-shift')

  $inputWindowWidth = $('#input-window-width')
  $inputWindowHeight = $('#input-window-height')

  $checkRememberSize = $('#check-remember-size')
  $checkRememberPosition = $('#check-remember-position')
  $checkAlwaysOnTop = $('#check-always-on-top')

  $inputBackgroundColor = $('#input-background-color')
  $checkWindowTransparency = $('#check-window-transparency')
  $inputWindowTransparency = $('#input-window-transparency')

  $btnSettingsReset = $('#btn-settings-reset')
  $btnSettingsOkay = $('#btn-settings-okay')

  settings = ipc.sendSync('settings.fetch')

  updateSettings()

  $btnSection.on('click', changeSettingsSection)

  $btnIconStyle.on('click', selectIconType)

  $checkShowDate.on('change', toggleShowDate)
  $selectDateFormat.on('change', selectDateFormat)

  $inputDateFormat.on('keyup', keyUpInputDateFormat)

// dese are ugly++
  $btnShortcutModifierAlt.click(function () {
    $(this).toggleClass('active')
    globalShortcutKeys.alt = $(this).hasClass('active')
    updateGlobalShortcutKeys()
  })

  $btnShortcutModifierCommand.click(function () {
    $(this).toggleClass('active')
    globalShortcutKeys.command = $(this).hasClass('active')
    updateGlobalShortcutKeys()
  })

  $btnShortcutModifierControl.click(function () {
    $(this).toggleClass('active')
    globalShortcutKeys.control = $(this).hasClass('active')
    updateGlobalShortcutKeys()
  })

  $btnShortcutModifierShift.click(function () {
    $(this).toggleClass('active')
    globalShortcutKeys.shift = $(this).hasClass('active')
    updateGlobalShortcutKeys()
  })
// end ugly++

  $inputGlobalShortcutKeys.on('keypress', keypressInputGlobalShortcutKeys)

  $inputWindowWidth.on('change', inputWidthChange)
  $inputWindowHeight.on('change', inputHeightChange)

  $checkRememberSize.on('change', toggleRememberSize)
  $checkRememberPosition.on('change', toggleRememberPosition)
  $checkAlwaysOnTop.on('change', toggleAlwaysOnTop)

  $inputBackgroundColor.on('input', setBackgroundColor)
  $inputWindowTransparency.on('input', setWindowTransparencyAmount)
  $checkWindowTransparency.on('change', checkWindowTransparency)

  // UI control event handlers
  $btnSettingsOkay.click(clickSettingsOkayBtn)
  $btnSettingsReset.click(clickSettingsResetBtn)

  // Open anchors in the user's browser
  $('a').on('click', function (e) {
    e.preventDefault()
    electronOpenLinkInBrowser($(this).attr('href'), e)
  })

  ipc.on('settings.updateBounds', updateBounds)

  ipc.sendSync('settings.windowReady')
})

// Load the settings values
// -------------------------

function updateSettings () {
  var $activeIconBtn

  // Set button.active + description for icon style
  $btnIconStyle.removeClass('active')
  $activeIconBtn = $btnIconStyle.filter('[data-icon-type="' + settings.menubar.iconType + '"]')
  $activeIconBtn.addClass('active')

  $iconTypeDescription.text($activeIconBtn.data('icon-description'))

  // Set the show date checkbox
  $checkShowDate.prop('checked', settings.menubar.showDate)

  // See if there's a match for date format, select it in the list
  findSelectDateFormatMatch()

  // Fill out the date format input
  $inputDateFormat.val(settings.menubar.dateFormat)

  // Set calendar hotkey input
  globalShortcutKeys = settings.globalShortcutKeys
  updateShortcutInputs()

  // Set window size width + height inputs
  $inputWindowWidth.val(settings.window.width)
  $inputWindowHeight.val(settings.window.height)

  // Set remember window size checkbox
  $checkRememberSize.prop('checked', settings.window.rememberSize)

  // Set remember window position checkbox
  $checkRememberPosition.prop('checked', settings.window.rememberPosition)

  // Set windows always on top checkbox
  $checkAlwaysOnTop.prop('checked', settings.window.alwaysOnTop)

  $inputBackgroundColor.val('#' + settings.window.backgroundColor)

  // Set window transparency checkbox + slider
  $checkWindowTransparency.prop('checked', settings.window.transparencyActive)
  $inputWindowTransparency.attr('disabled', !settings.window.transparencyActive)
  $inputWindowTransparency.val(settings.window.transparencyAmount)
}

// Change the settings section
// --------------------------
function changeSettingsSection () {
  var section = $(this).attr('data-section')

  $formPages.removeClass('active')
  $formPages.filter("[data-section='" + section + "']").addClass('active')
}

// Show date
// ---------------------

function toggleShowDate () {
  var isChecked = $(this).prop('checked')

  settings.menubar.showDate = isChecked
  ipc.sendSync('uiMessage.main', 'settings.toggleShowDate', isChecked)
}

// Date format
// ------------
function findSelectDateFormatMatch () {
  var found_match = false

  $selectDateFormatOptions.removeAttr('selected')
  $selectDateFormatOptions.each(function () {
    var $option = $(this)

    if ($option.attr('value') === settings.menubar.dateFormat) {
      found_match = true
      $option.attr('selected', true)
    }
  })

  if (!found_match) {
    $selectDateFormatOptions.filter('.custom').attr('selected', true)
  }
}

function selectDateFormat () {
  var value = $(this).val()

  // This is the custom selection; we don't need to change anything
  if (value === '') {
    return
  }

  $inputDateFormat.val(value)
  settings.menubar.dateFormat = value
  ipc.sendSync('uiMessage.main', 'setDateFormat', value)
}

function keyUpInputDateFormat () {
  var value = $(this).val()

  settings.menubar.dateFormat = value
  ipc.sendSync('uiMessage.main', 'setDateFormat', value)
  findSelectDateFormatMatch()
}

// Icon type
// ----------

function selectIconType () {
  var type = $(this).data('icon-type')
  var description = $(this).data('icon-description')

  $iconTypeDescription.text(description)
  $btnIconStyle.removeClass('active')
  $(this).addClass('active')

  settings.menubar.iconType = type
  ipc.sendSync('uiMessage.main', 'selectIconType', type)
}

// Hotkeys
// --------

function updateGlobalShortcutKeys () {
  ipc.sendSync('uiMessage.main', 'setGlobalShortcutKeys', globalShortcutKeys)
}

function updateShortcutInputs () {
  $inputGlobalShortcutKeys.val(globalShortcutKeys.key)

  if (globalShortcutKeys.alt) {
    $btnShortcutModifierAlt.addClass('active')
  } else {
    $btnShortcutModifierAlt.removeClass('active')
  }
  if (globalShortcutKeys.command) {
    $btnShortcutModifierCommand.addClass('active')
  } else {
    $btnShortcutModifierCommand.removeClass('active')
  }
  if (globalShortcutKeys.control) {
    $btnShortcutModifierControl.addClass('active')
  } else {
    $btnShortcutModifierControl.removeClass('active')
  }
  if (globalShortcutKeys.shift) {
    $btnShortcutModifierShift.addClass('active')
  } else {
    $btnShortcutModifierShift.removeClass('active')
  }
}

function keypressInputGlobalShortcutKeys (event) {
  var character = String.fromCharCode(event.which)
  var validKeys = /^\w+$/

  if (!validKeys.test(character)) {
    return
  }

  globalShortcutKeys.key = character
  $(this).val(character)
  updateGlobalShortcutKeys()
  event.preventDefault()
  return false
}

// Window size
// ------------

function updateBounds (new_bounds) {
  var new_width = new_bounds[0]
  var new_height = new_bounds[1]

  $inputWindowWidth.val(new_width)
  $inputWindowHeight.val(new_height)
}

function inputWidthChange () {
  var value = $(this).val()
  if (value < 240) {
    $inputWindowWidth.addClass('has-error')
    $inputWindowWidth.val(240)
    value = 240
  } else {
    $inputWindowWidth.removeClass('has-error')
  }

  setWindowSize(value, $inputWindowHeight.val())
}

function inputHeightChange () {
  var value = $(this).val()

  if (value < 200) {
    $inputWindowHeight.addClass('has-error')
    $inputWindowHeight.val(200)
    value = 200
  } else {
    $inputWindowHeight.removeClass('has-error')
  }

  setWindowSize($inputWindowWidth.val(), value)
}

function setWindowSize (new_width, new_height) {
  var new_size = {
    width: parseInt(new_width, 10),
    height: parseInt(new_height, 10)
  }

  ipc.sendSync('uiMessage.main', 'settings.setWindowSize', new_size)
}

// Remember window size
// ---------------------

function toggleRememberSize () {
  var isChecked = $(this).prop('checked')

  settings.window.rememberSize = isChecked
  ipc.sendSync('uiMessage.main', 'settings.toggleRememberSize', isChecked)
}

// Remember window position
// -------------------------

function toggleRememberPosition () {
  var isChecked = $(this).prop('checked')

  settings.window.rememberPosition = isChecked
  ipc.sendSync('uiMessage.main', 'settings.toggleRememberPosition', isChecked)
}

// Always on top
// --------------

function toggleAlwaysOnTop () {
  var isChecked = $(this).prop('checked')

  settings.window.alwaysOnTop = isChecked
  ipc.sendSync('uiMessage.main', 'settings.toggleAlwaysOnTop', isChecked)
}

// Background color
// -----------------

function setBackgroundColor () {
  ipc.sendSync('uiMessage.main', 'settings.setBackgroundColor', $(this).val())
}

// Window transparency
// --------------------

function checkWindowTransparency () {
  var isChecked = $(this).prop('checked')

  if (isChecked) {
    $inputWindowTransparency.removeAttr('disabled')
  } else {
    $inputWindowTransparency.attr('disabled', 'disabled')
  }

  ipc.sendSync('uiMessage.main', 'settings.toggleWindowTransparency', isChecked)
}

function setWindowTransparencyAmount () {
  ipc.sendSync('uiMessage.main', 'settings.setWindowTransparencyAmount', $(this).val())
}

// UI controls
// ------------

function clickSettingsResetBtn () {
  console.log('before: ' + settings.menubar.iconType)
  ipc.sendSync('uiMessage.main', 'settingsUI.clickedSettingsResetBtn')
  console.log('after: ' + settings.menubar.iconType)
  updateSettings()
}

function clickSettingsOkayBtn () {
  ipc.sendSync('uiMessage.main', 'settingsUI.clickedSettingsOkayBtn')
}

},{}]},{},["settings"]);
