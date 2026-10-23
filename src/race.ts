export const TOTAL_LAPS = 3
export const TAU = Math.PI * 2

export function trackHeading(angle: number) {
  return Math.atan2(78 * Math.cos(angle), -43 * Math.sin(angle))
}

export function advanceSpeed(speed: number, throttle: boolean, brake: boolean, handbrake: boolean, dt: number) {
  if (brake) speed = Math.max(-10, speed - 46 * dt)
  else if (throttle) speed = Math.min(30, speed + 27 * dt)
  else speed = approachZero(speed, 8.5 * dt)
  return handbrake ? approachZero(speed, 23 * dt) : speed
}

function approachZero(value: number, amount: number) {
  return Math.sign(value) * Math.max(0, Math.abs(value) - amount)
}

export function formatTime(seconds: number) {
  const centiseconds = Math.round(Math.max(0, seconds) * 100)
  const minutes = Math.floor(centiseconds / 6000)
  const remainder = centiseconds % 6000
  return `${String(minutes).padStart(2, '0')}:${String(Math.floor(remainder / 100)).padStart(2, '0')}.${String(remainder % 100).padStart(2, '0')}`
}

export function parseBest(value: string | null): number | null {
  if (value === null || value.trim() === '') return null
  const best = Number(value)
  return Number.isFinite(best) && best > 0 ? best : null
}

export function angleDelta(current: number, previous: number) {
  return Math.atan2(Math.sin(current - previous), Math.cos(current - previous))
}

// Gates must be crossed in order on the track, including the first start-line crossing.
export function advanceCheckpoint(checkpoint: number, before: number, after: number, onTrack: boolean) {
  const gate = checkpoint * Math.PI / 2
  return onTrack && before < gate && after >= gate ? checkpoint + 1 : checkpoint
}

export function completedLaps(checkpoint: number) {
  return Math.max(0, Math.floor((checkpoint - 1) / 4))
}
