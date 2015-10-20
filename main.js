var app = require('app')
var ipc = require('ipc')
var globalShortcut = require('global-shortcut')
var BrowserWindow = require('browser-window');
var menubar = require('menubar')
var moment = require('moment')

var options = {
    viewDirectory: 'file://' + app.getAppPath() + '/view',
    globalShortcutKeys: {
      alt: false,
      command: true,
      control: false,
      shift: true,
      key: '1'
    },
    dateFormat: 'MMMM Do YYYY, h:mm:ss a',
    alwaysOnTop: true,
    transparentWindow: false,
    transparencyAmount: 100
  },
  settingsWindowConfig = {
      width: 400,
      height: 400,
      resizable: false,
      show: false,
      frame: false,
      'always-on-top': true
    },
  settingsWindow = null,
  updateTimer = null,
  mb_options = {
    'icon': 'icon-default.png',
    'always-on-top': true,
    'preloadWindow': true,
    'width': 300, // TODO: load width and height from local storage after changing the window's size
    'height': 240,
    'min-width': 300,
    'min-height': 240,
    'index': options.viewDirectory + '/calendar.html',
    'transparent': false // TODO: find a way to swap this in runtime. recreate the window?
  },
  mb = menubar(mb_options)

mb.on('ready', function ready () {
  // Set up the menu bar
  mb.tray.setPressedImage('icon-pressed.png')
  mb.tray.setHighlightMode(true)
  updateMenubarText()

  resetUpdateTimer()

  resetGlobalShortcutKeys()

  ipc.on('uiMessage.main', uiListener)

  settingsWindow = new BrowserWindow(settingsWindowConfig)
  settingsWindow.loadUrl(options.viewDirectory + '/settings.html')
  settingsWindow.on('close', function () {
      console.log('closed settings window')
  })

  return

  function uiListener (event, message, arg1) {
    // console.log('main.js received ', event)
    var response = false

    switch (message) {
      case 'getDateFormat':
        response = options.dateFormat
        break
      case 'setDateFormat':
        response = setDateFormat(arg1)
        break
      case 'getGlobalShortcutKeys':
        response = options.globalShortcutKeys
        break
      case 'setGlobalShortcutKeys':
        response = setGlobalShortcutKeys(arg1)
        break
      case 'getDateString':
        response = getDateString()
        break
      case 'calendar.clickedSettingsBtn':
        response = clickSettingsBtn()
        break
      case 'settings.clickedSettingsOkayBtn':
        response = clickSettingsOkayBtn()
        break
      case 'settings.setWindowTransparencyAmount':
        response = setWindowTransparencyAmount(arg1)
        break
      case 'settings.toggleWindowTransparency':
        response = toggleWindowTransparency(arg1)
        break
      case 'settings.toggleAlwaysOnTop':
        response = toggleAlwaysOnTop(arg1)
        break
    }

    event.returnValue = response
  }

  function resetUpdateTimer () {
    // Every second, update the title with the new time
    updateTimer = setInterval(updateMenubarText, 1000)
  }

  function resetGlobalShortcutKeys () {
    globalShortcut.unregisterAll()
    globalShortcut.register(getGlobalShortcutKeysString(), pressedGlobalShortcutKeys)
  }

  function setGlobalShortcutKeys(new_keys) {
    options.globalShortcutKeys = new_keys;
    resetGlobalShortcutKeys()

    return true
  }

  function getGlobalShortcutKeys() {
    return options.globalShortcutKeys
  }

  function getGlobalShortcutKeysString() {
    var keys_string = '';

    if (options.globalShortcutKeys.alt)
      keys_string += 'Alt+'
    if (options.globalShortcutKeys.command)
      keys_string += 'Command+'
    if (options.globalShortcutKeys.control)
      keys_string += 'Control+'
    if (options.globalShortcutKeys.shift)
      keys_string += 'Shift+'
    keys_string += options.globalShortcutKeys.key

    return keys_string
  }

  function pressedGlobalShortcutKeys() {
    if (!mb.window.isVisible()) {
      mb.window.show()
    } else {
      mb.hideWindow()
    }
  }

  function clickSettingsBtn() {
    if (!settingsWindow.isVisible()) {
      settingsWindow.show()
    } else {
      settingsWindow.hide()
    }

    return true
  }

  function setDateFormat(new_format) {
    options.dateFormat = new_format;
    resetUpdateTimer()

    return true
  }

  // Toggle whether the calendar window is always on top
  function toggleAlwaysOnTop(isChecked) {
    options.alwaysOnTop = isChecked
    mb.window.setAlwaysOnTop(isChecked)

    return true
  }

  // Toggle window transparency
  function toggleWindowTransparency(isChecked) {
    options.transparentWindow = isChecked
    mb.window.webContents.send('calendar.toggleWindowTransparency', isChecked)

    return true
  }

  // Sets how much transparency the window will have
  function setWindowTransparencyAmount(percentage) {
    options.transparencyAmount = percentage
    mb.window.webContents.send('calendar.setWindowTransparencyAmount', percentage)

    return true
  }

  // Clicking the okay button in the settings panel
  function clickSettingsOkayBtn() {
    settingsWindow.hide()

    return true
  }

  function updateMenubarText () {
    var dateString = getDateString()
  	mb.tray.setTitle(dateString)
  }

  function getDateString () {
    var dateString = moment().format(options.dateFormat)

    return dateString
  }
});
