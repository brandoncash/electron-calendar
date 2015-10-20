require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"settings":[function(require,module,exports){
var ipc = electronRequire('ipc')
var $ = electronRequire('jquery-browserify')
var moment = electronRequire('moment')

var updateTimer,
  globalShortcutKeys = null,
  $inputGlobalShortcutKeys,
  $btnShortcutModifierAlt,
  $btnShortcutModifierCommand,
  $btnShortcutModifierControl,
  $btnShortcutModifierShift,
  $inputDateFormat,
  $outputDateFormat,
  $checkWindowTransparency,
  $inputWindowTransparency,
  $btnSettingsOkay,
  $checkAlwaysOnTop,
  $checkLaunchOnStartup

$(document).ready(function () {
  $inputGlobalShortcutKeys = $('#input-global-shortcut-keys')
  $btnShortcutModifierAlt = $('#btn-shortcut-modifier-alt')
  $btnShortcutModifierCommand = $('#btn-shortcut-modifier-command')
  $btnShortcutModifierControl = $('#btn-shortcut-modifier-control')
  $btnShortcutModifierShift = $('#btn-shortcut-modifier-shift')
  $inputDateFormat = $('#input-date-format')
  $outputDateFormat = $('#output-date-format span')
  $checkWindowTransparency = $('#check-window-transparency')
  $inputWindowTransparency = $('#input-window-transparency')
  $btnSettingsOkay = $('#btn-settings-okay')
  $checkAlwaysOnTop = $('#check-always-on-top')
  $checkLaunchOnStartup = $('#check-launch-on-startup')

  resetUpdateTimer()
  updateTimePreview()
  globalShortcutKeys = ipc.sendSync('uiMessage.main', 'getGlobalShortcutKeys')
  updateShortcutInputs()

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

  $inputDateFormat.val(ipc.sendSync('uiMessage.main', 'getDateFormat'));

  $inputDateFormat.on('keyup', keyUpInputDateFormat)
  $inputGlobalShortcutKeys.keypress(keypressInputGlobalShortcutKeys)
  $inputWindowTransparency.on('input', setWindowTransparencyAmount)
  $checkWindowTransparency.on('change', checkWindowTransparency)
  $checkAlwaysOnTop.on('change', toggleAlwaysOnTop)
  $btnSettingsOkay.click(clickSettingsOkayBtn)
})

return

function resetUpdateTimer () {
  updateTimer = setInterval(updateTimePreview, 1000)
}

function keyUpInputDateFormat () {
  ipc.sendSync('uiMessage.main', 'setDateFormat', $(this).val())
  resetUpdateTimer()
  updateTimePreview()
}

function updateGlobalShortcutKeys () {
  ipc.sendSync('uiMessage.main', 'setGlobalShortcutKeys', globalShortcutKeys)
}

function updateShortcutInputs () {
  $inputGlobalShortcutKeys.val(globalShortcutKeys.key);
  if (globalShortcutKeys.alt) {
    $btnShortcutModifierAlt.addClass('active')
  } else {
    $btnShortcutModifierAlt.removeClass('active')
  }
  if (globalShortcutKeys.command) {
    $btnShortcutModifierCommand.addClass('active')
  } else {
    $btnShortcutModifierCommand.aremoveClass('active')
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
  var character = String.fromCharCode(event.which),
    validKeys = /^\w+$/

  if (!validKeys.test(character))
    return

  globalShortcutKeys.key = character
  $(this).val(character)
  updateGlobalShortcutKeys()
  updateTimePreview()
  event.preventDefault()
  return false
}

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

function toggleAlwaysOnTop () {
  var isChecked = $(this).prop('checked')

  ipc.sendSync('uiMessage.main', 'settings.toggleAlwaysOnTop', isChecked)
}

function clickSettingsOkayBtn () {
  var reply = ipc.sendSync('uiMessage.main', 'settings.clickedSettingsOkayBtn')
}

function updateTimePreview () {
  var dateString = ipc.sendSync('uiMessage.main', 'getDateString')
  $outputDateFormat.text(dateString)
}

},{}]},{},["settings"]);
