import { test } from 'node:test'
import assert from 'node:assert/strict'
import { gamesEntryState } from '../src/gamesEntry.ts'

test('games entry copy follows whether the list has items', () => {
  assert.equal(gamesEntryState(3), 'live')
  assert.equal(gamesEntryState(1), 'live')
  assert.equal(gamesEntryState(0), 'soon')
  assert.equal(gamesEntryState(null), 'unknown')
  assert.equal(gamesEntryState(Number.NaN), 'unknown')
})
