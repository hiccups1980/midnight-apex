import * as THREE from 'three'
import './style.css'
import { advanceSpeed, formatTime as fmt, trackHeading, parseBest, angleDelta, advanceCheckpoint, completedLaps, TOTAL_LAPS } from './race.ts'

const app = document.querySelector<HTMLDivElement>('#app')!
const scene = new THREE.Scene()
scene.background = new THREE.Color('#aab9b7')
scene.fog = new THREE.FogExp2('#aab9b7', 0.0031)

const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 700)
let renderer: THREE.WebGLRenderer
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
} catch {
  app.innerHTML = '<div class="render-error" role="alert"><h1>3D-Grafik nicht verfügbar</h1><p>Bitte aktiviere WebGL bzw. Hardwarebeschleunigung oder öffne das Spiel in einem aktuellen Browser.</p></div>'
  throw new Error('WebGL konnte nicht initialisiert werden.')
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8))
renderer.setSize(innerWidth, innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.15
renderer.outputColorSpace = THREE.SRGBColorSpace
app.prepend(renderer.domElement)

const hemi = new THREE.HemisphereLight('#e2f1eb', '#43524b', 2.1)
scene.add(hemi)
const sun = new THREE.DirectionalLight('#fff1d6', 3.2)
sun.position.set(-55, 90, 30)
sun.castShadow = true
sun.shadow.mapSize.set(2048, 2048)
sun.shadow.camera.left = -130
sun.shadow.camera.right = 130
sun.shadow.camera.top = 130
sun.shadow.camera.bottom = -130
scene.add(sun)

const rx = 78
const rz = 43
const roadWidth = 13
const trackPoint = (t: number, offset = 0) => {
  const x = rx * Math.sin(t)
  const z = rz * Math.cos(t)
  const tx = rx * Math.cos(t)
  const tz = -rz * Math.sin(t)
  const length = Math.hypot(tx, tz)
  const nx = -tz / length
  const nz = tx / length
  return new THREE.Vector3(x + nx * offset, 0, z + nz * offset)
}

const grass = new THREE.Mesh(new THREE.PlaneGeometry(520, 360), new THREE.MeshStandardMaterial({ color: '#708a71', roughness: 1 }))
grass.rotation.x = -Math.PI / 2
grass.position.y = -0.08
grass.receiveShadow = true
scene.add(grass)

function ribbon(innerOffset: number, outerOffset: number, material: THREE.Material, y: number) {
  const positions: number[] = []
  const indices: number[] = []
  const count = 300
  for (let i = 0; i <= count; i++) {
    const t = (i / count) * Math.PI * 2
    for (const offset of [innerOffset, outerOffset]) {
      const point = trackPoint(t, offset)
      positions.push(point.x, y, point.z)
    }
    if (i < count) {
      const n = i * 2
      indices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  const mesh = new THREE.Mesh(geometry, material)
  mesh.receiveShadow = true
  scene.add(mesh)
}

ribbon(-roadWidth / 2 - 1.4, roadWidth / 2 + 1.4, new THREE.MeshStandardMaterial({ color: '#e8e2d1', roughness: 0.95 }), 0.01)
ribbon(-roadWidth / 2, roadWidth / 2, new THREE.MeshStandardMaterial({ color: '#343b3a', roughness: 0.92 }), 0.035)
ribbon(-roadWidth / 2 + 0.35, -roadWidth / 2 + 0.62, new THREE.MeshStandardMaterial({ color: '#d6c7a1', roughness: 0.9 }), 0.055)
ribbon(roadWidth / 2 - 0.62, roadWidth / 2 - 0.35, new THREE.MeshStandardMaterial({ color: '#d6c7a1', roughness: 0.9 }), 0.055)

const dashMaterial = new THREE.MeshStandardMaterial({ color: '#e5dec8', roughness: 0.8 })
for (let i = 0; i < 64; i++) {
  const t = (i / 64) * Math.PI * 2
  const p = trackPoint(t)
  const dash = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.025, 1.35), dashMaterial)
  dash.position.set(p.x, 0.065, p.z)
  dash.rotation.y = trackHeading(t)
  scene.add(dash)
}

const startLine = new THREE.Group()
const startPoint = trackPoint(0)
for (let i = 0; i < 20; i++) {
  const tile = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.035, roadWidth / 20), new THREE.MeshStandardMaterial({ color: i % 2 ? '#202624' : '#f0e9d9', roughness: 0.85 }))
  tile.position.set(startPoint.x + (i % 2 ? -0.18 : 0.18), 0.075, startPoint.z + (i - 9.5) * (roadWidth / 20))
  startLine.add(tile)
}
scene.add(startLine)

// Simplified coastal scenery: cypress silhouettes, stones and warm trackside flags.
const treeGreen = new THREE.MeshStandardMaterial({ color: '#294a3b', roughness: 1 })
const treeDark = new THREE.MeshStandardMaterial({ color: '#203c32', roughness: 1 })
const trunkMat = new THREE.MeshStandardMaterial({ color: '#5b4937', roughness: 1 })
for (let i = 0; i < 95; i++) {
  const t = (i / 95) * Math.PI * 2 + 0.018
  const side = i % 2 ? 1 : -1
  const p = trackPoint(t, side * (roadWidth * 0.5 + 9 + (i % 4) * 4))
  const h = 5 + (i % 5) * 1.15
  const tree = new THREE.Group()
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.38, h * 0.62, 5), trunkMat)
  trunk.position.y = h * 0.31
  const crown = new THREE.Mesh(new THREE.ConeGeometry(1.15 + (i % 3) * 0.24, h, 6), i % 3 ? treeGreen : treeDark)
  crown.position.y = h * 0.75
  tree.add(trunk, crown)
  tree.position.set(p.x, 0, p.z)
  tree.rotation.y = i * 2.2
  tree.castShadow = true
  scene.add(tree)
}

function makeCar(color: string, number: string) {
  const car = new THREE.Group()
  const paint = new THREE.MeshStandardMaterial({ color, metalness: 0.25, roughness: 0.34 })
  const dark = new THREE.MeshStandardMaterial({ color: '#202524', metalness: 0.12, roughness: 0.48 })
  const glass = new THREE.MeshStandardMaterial({ color: '#182e33', metalness: 0.36, roughness: 0.2 })
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.62, 4.35), paint)
  body.position.y = 0.78
  body.castShadow = true
  car.add(body)
  const nose = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.27, 1.12), paint)
  nose.position.set(0, 0.89, 1.94)
  nose.castShadow = true
  car.add(nose)
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.75, 1.72), glass)
  cabin.position.set(0, 1.31, 0.18)
  cabin.castShadow = true
  car.add(cabin)
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.12, 1.08), paint)
  roof.position.set(0, 1.7, 0.17)
  car.add(roof)
  const bumper = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.18, 0.26), dark)
  bumper.position.set(0, 0.55, 2.15)
  car.add(bumper)
  const spoiler = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.12, 0.35), paint)
  spoiler.position.set(0, 1.3, -2.04)
  car.add(spoiler)
  for (const x of [-1.12, 1.12]) for (const z of [-1.35, 1.35]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.3, 16), dark)
    wheel.rotation.z = Math.PI / 2
    wheel.position.set(x, 0.48, z)
    wheel.castShadow = true
    car.add(wheel)
  }
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.34, 0.08), new THREE.MeshStandardMaterial({ color: '#f2ead6', roughness: 0.8 }))
  plate.position.set(0, 1.2, 1.04)
  car.add(plate)
  const num = document.createElement('canvas')
  num.width = 128; num.height = 128
  const ctx = num.getContext('2d')!
  ctx.fillStyle = '#f2ead6'; ctx.fillRect(0, 0, 128, 128)
  ctx.fillStyle = '#17201d'; ctx.font = 'bold 84px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(number, 64, 67)
  const badge = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(num) }))
  badge.position.set(0, 1.03, 1.09)
  car.add(badge)
  return car
}

const player = makeCar('#d7a844', '7')
scene.add(player)
const rival = makeCar('#507c81', '4')
scene.add(rival)

const keys = new Set<string>()
let started = false
let finished = false
let elapsed = 0
let lap = 1
let previousAngle = -0.12
let playerProgress = -0.12
let rivalProgress = 0.13
let speed = 0
let heading = trackHeading(-0.12)
let best: number | null = null
try { best = parseBest(localStorage.getItem('midnight-apex-best')) } catch { /* Storage may be disabled. */ }
let checkpoint = 0
let paused = false
let contextLost = false
let soundOn = false
let audio: AudioContext | undefined
let countdown = 0
let messageTimer = 0

const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!
const speedEl = $('#speed')
const speedBar = $('#speed-bar')
const timeEl = $('#time')
const bestEl = $('#best')
const message = $('#race-message')
const messageText = $('#message-text')

bestEl.textContent = best ? fmt(best) : '—:—.—'

function positionCar(car: THREE.Group, angle: number, offset = 0) {
  const point = trackPoint(angle, offset)
  car.position.set(point.x, 0, point.z)
  car.rotation.y = trackHeading(angle)
}

positionCar(player, previousAngle)
positionCar(rival, rivalProgress, 1.6)

function updateCamera(dt: number) {
  const forward = new THREE.Vector3(Math.sin(heading), 0, Math.cos(heading))
  const desired = player.position.clone().addScaledVector(forward, -13).add(new THREE.Vector3(0, 7.4, 0))
  camera.position.lerp(desired, 1 - Math.exp(-dt * 3.4))
  const look = player.position.clone().addScaledVector(forward, 9).add(new THREE.Vector3(0, 1, 0))
  camera.lookAt(look)
}

function playTone(frequency: number, duration = 0.16) {
  if (!soundOn) return
  try {
    audio ??= new AudioContext()
    if (audio.state === 'suspended') void audio.resume().catch(() => {})
    const oscillator = audio.createOscillator()
    const gain = audio.createGain()
    oscillator.type = 'square'
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0.045, audio.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration)
    oscillator.connect(gain).connect(audio.destination)
    oscillator.start()
    oscillator.stop(audio.currentTime + duration)
  } catch { soundOn = false; $('#sound-toggle').classList.remove('active') }
}

function beginCountdown() {
  if (started || finished || countdown > 0) return
  countdown = 3
  app.classList.add('racing')
  $('#start-button').setAttribute('disabled', '')
  $('#start-button').classList.add('hidden')
  $('#controls-hint').classList.add('visible')
  $('#race-state').textContent = 'MACH DICH BEREIT'
  $('#footer-state').textContent = 'STARTET GLEICH'
  message.classList.add('visible')
  messageText.textContent = '3'
  playTone(390)
}

function resetRace() {
  started = false; finished = false; elapsed = 0; lap = 1; speed = 0; heading = trackHeading(-0.12)
  previousAngle = -0.12; playerProgress = -0.12; rivalProgress = 0.13; countdown = 0; checkpoint = 0; messageTimer = 0; paused = false
  keys.clear()
  $('#footer-state').textContent = 'RENNEN BEREIT'
  app.classList.remove('racing')
  $('#start-button').removeAttribute('disabled')
  positionCar(player, previousAngle); positionCar(rival, rivalProgress, 1.6)
  $('#lap').textContent = '01'; $('#position').textContent = '2'; $('#race-state').textContent = 'BEREIT ZUM START'
  $('#time').textContent = '00:00.00'; $('#speed').textContent = '000'
  $('#speed-bar').style.width = '0%'
  $('#finish-banner').classList.remove('visible')
  $('#start-button').classList.remove('hidden')
  $('#controls-hint').classList.remove('visible')
  $('#restart-button').classList.remove('visible')
  message.classList.remove('visible')
  player.rotation.y = heading
  updateCamera(10)
}

$('#start-button').addEventListener('click', beginCountdown)
$('#restart-button').addEventListener('click', resetRace)
$('#again-button').addEventListener('click', resetRace)
$('#sound-toggle').addEventListener('click', () => {
  soundOn = !soundOn
  $('#sound-toggle').classList.toggle('active', soundOn)
  if (soundOn) playTone(520)
})
window.addEventListener('keydown', event => {
  if (event.repeat && ['r', 'enter'].includes(event.key.toLowerCase())) return
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault()
  keys.add(event.key.toLowerCase())
  if (event.key === 'Enter' && !(event.target instanceof HTMLButtonElement) && !started && !finished) beginCountdown()
  if (event.key.toLowerCase() === 'r') resetRace()
})
window.addEventListener('keyup', event => keys.delete(event.key.toLowerCase()))
window.addEventListener('blur', () => { keys.clear(); paused = true; $('#footer-state').textContent = 'PAUSIERT' })
window.addEventListener('focus', () => { paused = false; $('#footer-state').textContent = started ? 'RENNEN LÄUFT' : 'RENNEN BEREIT' })
document.addEventListener('visibilitychange', () => { paused = document.hidden; keys.clear() })

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-key]')) {
  button.addEventListener('pointerdown', event => {
    event.preventDefault()
    button.setPointerCapture(event.pointerId)
    keys.add(button.dataset.key!)
  })
  const release = () => keys.delete(button.dataset.key!)
  button.addEventListener('pointerup', release)
  button.addEventListener('pointercancel', release)
  button.addEventListener('lostpointercapture', release)
}
renderer.domElement.addEventListener('webglcontextlost', event => {
  event.preventDefault(); contextLost = true; keys.clear()
  $('#footer-state').textContent = 'GRAFIK PAUSIERT'
})
renderer.domElement.addEventListener('webglcontextrestored', () => {
  contextLost = false
  $('#footer-state').textContent = started ? 'RENNEN LÄUFT' : 'RENNEN BEREIT'
})

const clock = new THREE.Clock()
function animate() {
  requestAnimationFrame(animate)
  const frameDelta = clock.getDelta()
  const dt = paused || contextLost ? 0 : Math.min(frameDelta, 0.1)
  if (countdown > 0) {
    countdown -= dt
    const n = Math.min(3, Math.ceil(countdown))
    if (n > 0) messageText.textContent = String(n)
    else {
      started = true; countdown = 0; messageText.textContent = 'LOS!'; $('#race-state').textContent = 'RENNEN LÄUFT'
      $('#footer-state').textContent = 'RENNEN LÄUFT'; $('#restart-button').classList.add('visible'); playTone(660, 0.34)
      messageTimer = 0.9
    }
  }
  if (messageTimer > 0) { messageTimer -= dt; if (messageTimer <= 0) message.classList.remove('visible') }

  if (started && !finished) {
    elapsed += dt
    const accelerating = keys.has('arrowup') || keys.has('w')
    const braking = keys.has('arrowdown') || keys.has('s')
    const handbrake = keys.has(' ')
    speed = advanceSpeed(speed, accelerating, braking, handbrake, dt)
    const steer = (keys.has('arrowleft') || keys.has('a') ? 1 : 0) - (keys.has('arrowright') || keys.has('d') ? 1 : 0)
    heading += steer * Math.sign(speed || 1) * Math.min(Math.abs(speed) / 25, 1) * (handbrake ? 1.8 : 1.05) * dt
    const forward = new THREE.Vector3(Math.sin(heading), 0, Math.cos(heading))
    player.position.addScaledVector(forward, speed * dt)

    const rxNow = player.position.x / rx
    const rzNow = player.position.z / rz
    const angle = Math.atan2(rxNow, rzNow)
    const before = playerProgress
    playerProgress += angleDelta(angle, previousAngle)
    previousAngle = angle
    const nearest = trackPoint(angle, 0)
    const distance = Math.hypot(player.position.x - nearest.x, player.position.z - nearest.z)
    if (distance > roadWidth * 0.58) speed *= Math.max(0.25, 1 - dt * 2.3)
    if (distance > roadWidth * 1.5) speed *= Math.max(0.18, 1 - dt * 3)

    checkpoint = advanceCheckpoint(checkpoint, before, playerProgress, distance <= roadWidth / 2)
    const completed = completedLaps(checkpoint)
    if (completed >= TOTAL_LAPS) {
      finished = true; started = false; speed = 0
      $('#finish-time').textContent = fmt(elapsed)
      $('#finish-banner').classList.add('visible')
      $('#race-state').textContent = 'ZIEL ERREICHT'
      $('#footer-state').textContent = 'ZIEL ERREICHT'
      if (best === null || elapsed < best) {
        best = elapsed
        try { localStorage.setItem('midnight-apex-best', String(best)) } catch { /* Race still works without storage. */ }
        bestEl.textContent = fmt(best)
      }
    } else if (completed + 1 > lap) {
      lap = completed + 1
      messageText.textContent = `RUNDE ${lap}`; message.classList.add('visible'); messageTimer = 1.2; playTone(520)
    }
    rivalProgress += 0.46 * dt
    positionCar(rival, rivalProgress % (Math.PI * 2), 1.6)
    $('#position').textContent = playerProgress > rivalProgress ? '1' : '2'
    $('#lap').textContent = String(lap).padStart(2, '0')
    $('#time').textContent = fmt(elapsed)
  }

  player.rotation.y = heading
  const kmh = Math.round(Math.abs(speed) * 7.2)
  speedEl.textContent = String(kmh).padStart(3, '0')
  speedBar.style.width = `${Math.min(100, kmh / 2.3)}%`
  updateCamera(dt)
  if (!contextLost) renderer.render(scene, camera)
}

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth, innerHeight)
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8))
})

updateCamera(1)
animate()
