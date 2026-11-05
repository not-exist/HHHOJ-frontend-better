import test from 'node:test'
import assert from 'node:assert/strict'
import { MAX_ZAN_VOTES, nextZan } from '../node_modules/.cache/zan-test/zan.js'

test('one-vote target: first vote starts the side', () => {
  assert.equal(nextZan(0, 1, false), 1)
  assert.equal(nextZan(0, -1, false), -1)
})

test('one-vote target: same side is a no-op', () => {
  assert.equal(nextZan(1, 1, false), 1)
  assert.equal(nextZan(-1, -1, false), -1)
})

test('one-vote target: opposite side takes the vote back', () => {
  assert.equal(nextZan(1, -1, false), 0)
  assert.equal(nextZan(-1, 1, false), 0)
})

test('multi-vote target adds one vote per click', () => {
  assert.equal(nextZan(0, 1, true), 1)
  assert.equal(nextZan(1, 1, true), 2)
  assert.equal(nextZan(1, -1, true), 0)
})

test('multi-vote target stops at the cap for normal users', () => {
  assert.equal(nextZan(MAX_ZAN_VOTES - 1, 1, true), MAX_ZAN_VOTES)
  assert.equal(nextZan(MAX_ZAN_VOTES, 1, true), null)
  assert.equal(nextZan(-MAX_ZAN_VOTES, -1, true), null)
})

test('unlimited voters skip the cap', () => {
  assert.equal(nextZan(MAX_ZAN_VOTES, 1, true, true), MAX_ZAN_VOTES + 1)
})
