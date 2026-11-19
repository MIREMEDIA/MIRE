import { test } from 'node:test'
import assert from 'node:assert/strict'
import { gamesEntryFromList } from '../src/gamesEntry.ts'

test('games copy separates open list, empty list, and failure', () => {
  assert.equal(gamesEntryFromList({ code: 1, data: { list: [{ id: 1 }], total: 1 } }), 'live')
  assert.equal(gamesEntryFromList({ code: 1, data: { list: [], total: 3 } }), 'live')
  assert.equal(gamesEntryFromList({ code: 1, data: { list: [], total: 0 } }), 'soon')
  assert.equal(gamesEntryFromList({ code: 0, data: { list: [], total: 0 } }), 'fail')
  assert.equal(gamesEntryFromList({ code: 401, data: null }), 'fail')
  assert.equal(gamesEntryFromList(null), 'fail')
  assert.equal(gamesEntryFromList({ code: 1, data: { list: null, total: 5 } }), 'fail')
})
