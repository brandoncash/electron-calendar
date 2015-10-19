var app = require('app')
var ipc = require('ipc')
var BrowserWindow = require('browser-window');
var menubar = require('menubar')
var moment = require('moment')

var options = {
    viewDirectory: 'file://' + app.getAppPath() + '/view'
  },
  settingsWindowConfig = {
      width: 400,
      height: 400,
      resizable: false,
      show: false,
      frame: false,
      'always-on-top': true
    },
  settingsWindow = null

var mb_options = {
    'icon': 'icon-default.png',
    'always-on-top': true,
    'preloadWindow': true,
    'width': 300, // TODO: load width and height from local storage after changing the window's size
    'height': 240,
    'min-width': 300,
    'min-height': 240,
    'index': options.viewDirectory + '/calendar.html'
  },
  mb = menubar(mb_options)

mb.on('ready', function ready () {
  // Set up the menu bar
  mb.tray.setPressedImage('icon-pressed.png')
  mb.tray.setHighlightMode(true)
  updateMenubarText()

  // Every second, update the title with the new time
  setInterval(updateMenubarText, 1000)

  // clickSettingsBtn()

  ipc.on('uiMessage', function(event, message) {
    var response = false

    switch (message) {
      case 'clickedSettingsBtn':
        response = clickSettingsBtn()
        break
      case 'clickedSettingsOkayBtn':
        response = clickSettingsOkayBtn()
        break
    }

    event.returnValue = response
  })

  return

  function clickSettingsBtn() {
    if (settingsWindow === null) {
      console.log('opening settingsWindow')
      settingsWindow = new BrowserWindow(settingsWindowConfig)
      settingsWindow.loadUrl(options.viewDirectory + '/settings.html')
      settingsWindow.show()

      settingsWindow.on('close', function () {
        console.log('close settingsWindow')
        settingsWindow = null
      })
    } else {
      console.log('already open')
      settingsWindow.hide()
      settingsWindow = null
    }

    return true
  }

  function clickSettingsOkayBtn() {
    console.log('Here I would be saving the settings')
    settingsWindow.close()

    return true
  }

  function updateMenubarText () {
    var dateString = getDateString()
  	mb.tray.setTitle(dateString)
  }

  function getDateString () {
    var dateString = moment().format('MMMM Do YYYY, h:mm:ss a')

    return dateString
  }
});
