import { test } from 'node:test'
import assert from 'node:assert/strict'
import { assembleSearchResults, compactQuery, planSearchMerge, shownTitle, titleMatchesQuery } from '../src/api/searchCore.ts'
import { cleanTitle } from '../src/utils.ts'

const rotiRaw = { id: 42, title: 'RotiDanEmas', image: 'a' }
const rotiStaging = { id: 's7', title: 'Roti Dan Emas', image: 'b' }
const other = { id: 9, title: 'Other Show', image: 'c' }

test('shown title matches the poster helper', () => {
  for (const t of ['RotiDanEmas', 'RotiDanEmas-en', 'Roti Dan Emas', 'QA VIP Lane']) assert.equal(shownTitle(t), cleanTitle(t))
})

test('display title matches the camelCase catalog title', () => {
  assert.equal(titleMatchesQuery('RotiDanEmas', 'Roti Dan Emas'), true)
  assert.equal(titleMatchesQuery('RotiDanEmas-en', 'Roti Dan Emas'), true)
  assert.equal(titleMatchesQuery('Roti Dan Emas', 'Roti Dan Emas'), true)
  assert.equal(titleMatchesQuery('Other Show', 'Roti Dan Emas'), false)
  assert.equal(compactQuery('Roti Dan Emas'), 'RotiDanEmas')
})

test('spaced catalog miss is recovered from the raw-title response, not invented', () => {
  const rows = assembleSearchResults('Roti Dan Emas', { primary: [], variant: [rotiRaw, other], staging: [] })
  assert.deepEqual(rows.map(r => r.id), [42])
})

test('staging library row visible on home is searchable', () => {
  const rows = assembleSearchResults('Roti Dan Emas', { primary: [], variant: [], staging: [rotiStaging, other] })
  assert.deepEqual(rows.map(r => r.id), ['s7'])
})

test('primary hits are kept and duplicate ids collapse', () => {
  const rows = assembleSearchResults('Roti Dan Emas', { primary: [rotiRaw], variant: [rotiRaw], staging: [rotiStaging] })
  assert.deepEqual(rows.map(r => r.id), [42, 's7'])
})

test('same id is kept once even when the type differs', () => {
  const rows = assembleSearchResults('Roti Dan Emas', { primary: [{ id: 42, title: 'RotiDanEmas' }], variant: [{ id: '42', title: 'RotiDanEmas' }], staging: [{ id: ' 42 ', title: 'Roti Dan Emas' }] })
  assert.deepEqual(rows.map(r => r.id), [42])
})

test('extra requests cannot add rows that do not match the query', () => {
  const rows = assembleSearchResults('Roti Dan Emas', { primary: [], variant: [other, { id: 8, title: 'Gold' }], staging: [{ id: 's1', title: 'Hidden Draft' }] })
  assert.deepEqual(rows, [])
})

test('primary auth failure discards variant and staging', () => {
  const merged = planSearchMerge('Roti Dan Emas', {
    primary: { ok: true, denied: true, data: [] },
    variant: { ok: true, data: [rotiRaw] },
    staging: { ok: true, data: [rotiStaging] },
  })
  assert.equal(merged.failed, true)
  assert.deepEqual(merged.rows, [])
})

test('a failed extra request keeps primary rows and is not a search failure', () => {
  const merged = planSearchMerge('Roti Dan Emas', {
    primary: { ok: true, data: [rotiRaw] },
    variant: { ok: false, data: [other] },
    staging: { ok: true, denied: true, data: [rotiStaging] },
  })
  assert.equal(merged.failed, false)
  assert.deepEqual(merged.rows.map(r => r.id), [42])
})

test('primary network failure does not surface other sources', () => {
  const merged = planSearchMerge('Roti Dan Emas', {
    primary: { ok: false, data: null },
    variant: { ok: true, data: [rotiRaw] },
    staging: { ok: true, data: [rotiStaging] },
  })
  assert.equal(merged.failed, true)
  assert.deepEqual(merged.rows, [])
})

test('empty sources stay empty', () => {
  assert.deepEqual(assembleSearchResults('Roti Dan Emas', { primary: [], variant: [], staging: [] }), [])
  assert.deepEqual(assembleSearchResults('Roti Dan Emas', { primary: null, variant: { list: [rotiRaw] }, staging: undefined }), [])
  assert.deepEqual(assembleSearchResults('   ', { primary: [rotiRaw] }), [])
})
