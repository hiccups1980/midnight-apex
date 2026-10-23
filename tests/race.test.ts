import { test } from 'node:test'
import assert from 'node:assert/strict'
import { advanceSpeed, formatTime, trackHeading, parseBest, angleDelta, advanceCheckpoint, completedLaps, TAU } from '../src/race.ts'

test('coasting and handbraking stop at zero in both directions', () => {
  assert.equal(advanceSpeed(0, false, false, false, 1), 0)
  assert.equal(advanceSpeed(1, false, false, false, 1), 0)
  assert.equal(advanceSpeed(-1, false, false, false, 1), -0)
  assert.equal(advanceSpeed(1, false, false, true, 1), 0)
  assert.equal(advanceSpeed(-1, false, false, true, 1), -0)
})

test('throttle, reverse and speed limits work', () => {
  assert.equal(advanceSpeed(0, true, false, false, 1), 27)
  assert.equal(advanceSpeed(29, true, false, false, 1), 30)
  assert.equal(advanceSpeed(0, false, true, false, 1), -10)
})

test('car heading follows the ellipse tangent in every quadrant', () => {
  for (let i = 0; i < 100; i++) {
    const a = i * TAU / 100
    const heading = trackHeading(a)
    const length = Math.hypot(78 * Math.cos(a), -43 * Math.sin(a))
    assert.ok(Math.abs(Math.sin(heading) - 78 * Math.cos(a) / length) < 1e-10)
    assert.ok(Math.abs(Math.cos(heading) + 43 * Math.sin(a) / length) < 1e-10)
  }
})

test('time formatting carries centiseconds through minute boundaries', () => {
  assert.equal(formatTime(59.999), '01:00.00')
  assert.equal(formatTime(61.234), '01:01.23')
  assert.equal(formatTime(0), '00:00.00')
})

test('invalid saved best times are ignored', () => {
  for (const v of [null, '', 'garbage', '-1', 'NaN', 'Infinity', '0']) assert.equal(parseBest(v), null)
  assert.equal(parseBest('45.2'), 45.2)
})

test('angle unwrapping supports both directions over the seam', () => {
  assert.ok(Math.abs(angleDelta(-Math.PI + .1, Math.PI - .1) - .2) < 1e-10)
  assert.ok(Math.abs(angleDelta(Math.PI - .1, -Math.PI + .1) + .2) < 1e-10)
})

test('three complete laps require all gates in order; start crossing is not a lap', () => {
  let checkpoint = advanceCheckpoint(0, -.1, .1, true)
  assert.equal(completedLaps(checkpoint), 0)
  for (let gate = 1; gate <= 12; gate++) {
    const angle = gate * Math.PI / 2
    checkpoint = advanceCheckpoint(checkpoint, angle - .01, angle + .01, true)
    assert.equal(completedLaps(checkpoint), Math.floor(gate / 4))
  }
  assert.equal(completedLaps(checkpoint), 3)
})

test('off-track shortcuts, skipped gates and backward crossings do not count', () => {
  assert.equal(advanceCheckpoint(1, 1.5, 1.7, false), 1)
  assert.equal(advanceCheckpoint(1, 1.7, 1.5, true), 1)
  assert.equal(advanceCheckpoint(1, 3.1, 3.2, true), 1)
})
