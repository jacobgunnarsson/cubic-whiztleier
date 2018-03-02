const pitchDetector = require('./js/pitch-detector')
const recorder = require('./js/recorder')

document.addEventListener('DOMContentLoaded', () => {
  pitchDetector.init()
  recorder.init()
})
