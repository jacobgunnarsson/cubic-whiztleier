const config = require('./config')
const fitCurve = require('./fit-curve')

const START_LISTENING_THRESHOLD = 0.1
const STOP_LISTENING_THRESHOLD = 0.025
const EASING_DURATION = 1000
const MIN_EASING_DURATION = 100
const REASONABLE_MAX = 100
const REASONABLE_LOW = 80

let recorderEl, prevRecorderEl
let recorderCanvasEl
let recorderCanvasCtx
let recorderCanvasWidth
let recorderCanvasHeight
let recordingInterval
let recordingDuration = 0
let latestDrawRAFId
let latestListeningRAFId
let noteSamples = []
let bezierSamples = []

const getYMax = () => Math.max(...noteSamples.map(sample => sample.pitch))
const getYMin = () => Math.min(...noteSamples.map(sample => sample.pitch))

const getX = (sample) => recorderCanvasWidth * (sample.duration / EASING_DURATION)

const getY = (sample) => {
  return recorderCanvasHeight - (((sample.pitch - getYMin()) / (getYMax() - getYMin())) * recorderCanvasHeight)
}

function init() {
  appendRecorder()
  startListening()
}

function appendRecorder() {
  recorderEl = document.createElement('div')
  recorderCanvasEl = document.createElement('canvas')

  recorderEl.classList.add('recorder')
  recorderEl.appendChild(recorderCanvasEl)

  recorderCanvasCtx = recorderCanvasEl.getContext('2d')

  if (prevRecorderEl) {
    document.querySelector('.js-recorders').insertBefore(recorderEl, prevRecorderEl)

    recordingDuration = 0
    noteSamples = []
    bezierSamples = []

    startListening()
  } else {
    document.querySelector('.js-recorders').appendChild(recorderEl)
  }

  prevRecorderEl = recorderEl
}

function startListening() {
  console.log('recorder.startListening')

  recorderEl.classList.add('recorder--is-listening')

  listen()
}

function listen() {
  if (window.volume > START_LISTENING_THRESHOLD) {
    cancelAnimationFrame(latestListeningRAFId)

    recorderEl.classList.remove('recorder--is-listening')

    startRecording()
  } else {
    latestListeningRAFId = requestAnimationFrame(listen)
  }
}

function startRecording() {
  console.log('recorder.startRecording')

  let lastTime = performance.now()

  recorderEl.classList.add('recorder--is-recording')

  if (!recorderCanvasWidth || !recorderCanvasHeight) {
    recorderCanvasWidth = recorderCanvasEl.width
    recorderCanvasHeight = recorderCanvasEl.height
  }

  draw()

  recordingInterval = setInterval(() => {
    let currentTime = performance.now()
    let nextRecordingDuration = recordingDuration + (currentTime - lastTime)

    noteSamples.push({
      pitch: window.note,
      duration: recordingDuration,
    })

    if (nextRecordingDuration > EASING_DURATION ||
        window.volume < STOP_LISTENING_THRESHOLD) {
      recorderEl.classList.remove('recorder--is-recording')

      clearInterval(recordingInterval)

      finishedRecording()
    } else {
      recordingDuration = nextRecordingDuration
      lastTime = currentTime
    }
  }, 10)
}

function draw() {
  if (noteSamples.length) {
    recorderCanvasCtx.clearRect(0, 0, recorderCanvasWidth, recorderCanvasHeight)

    noteSamples.forEach((sample, index) => {
      const prevSample = index > 0 ? noteSamples[index - 1] : undefined

      const toX = getX(sample)
      const toY = getY(sample)
      const fromX = prevSample ? getX(prevSample) : toX
      const fromY = prevSample ? getY(prevSample) : 0

      recorderCanvasCtx.strokeStyle = 'green'
      recorderCanvasCtx.beginPath()
      recorderCanvasCtx.moveTo(fromX, fromY);
      recorderCanvasCtx.lineTo(toX, toY);
      recorderCanvasCtx.stroke();
    })

    drawComplexBezier()
  }

  latestDrawRAFId = requestAnimationFrame(draw)
}

function drawSimpleBezier() {
  const windowSize = 30

  const startAveragePitch =
    noteSamples
      .slice(0, windowSize)
      .reduce((prev, current) => prev + current.pitch, 0) / windowSize


  const endAveragePitch =
    noteSamples
      .slice(noteSamples.length - windowSize, noteSamples.length)
      .reduce((prev, current) => prev + current.pitch, 0) / windowSize

  const bezierCurves = fitCurve([[0, startAveragePitch], [recorderCanvasWidth, endAveragePitch]])

  recorderCanvasCtx.moveTo(0, 0);
  recorderCanvasCtx.strokeStyle = 'red'

  bezierCurves.forEach(curve => {
    recorderCanvasCtx.bezierCurveTo(
      curve[0][0],
      curve[0][1],
      curve[1][0],
      curve[1][1],
      curve[2][0],
      curve[2][1],
    )
  })

  recorderCanvasCtx.stroke();
}

function drawComplexBezier() {
  const points = noteSamples.map(sample => [getX(sample), getY(sample)])
  const error = 1
  const bezierCurves = fitCurve(points, error)

  recorderCanvasCtx.moveTo(0, 0);
  recorderCanvasCtx.strokeStyle = 'red'

  bezierCurves.forEach(curve => {
    recorderCanvasCtx.bezierCurveTo(
      curve[0][0],
      curve[0][1],
      curve[1][0],
      curve[1][1],
      curve[2][0],
      curve[2][1],
    )
  })

  recorderCanvasCtx.stroke();
}

function finishedRecording() {
  console.log('recorder.finishedRecording')

  console.log(bezierSamples)
  console.log(noteSamples.map(sample => [sample.duration, sample.pitch]))

  cancelAnimationFrame(latestDrawRAFId)

  setTimeout(() => {
    appendRecorder()
  }, 1000)
}

module.exports = { init }

