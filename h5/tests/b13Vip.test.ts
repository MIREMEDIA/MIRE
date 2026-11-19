import { test } from 'node:test'
import assert from 'node:assert/strict'
import { vipState, fmtVipDate } from '../src/vipState.ts'
const now = Date.UTC(2026, 10, 3, 6, 0, 0) // 2026-11-03 14:00 UTC+8
test('future seconds -> VIP (11-05 00:00 +08)', () => { const r = vipState({ vip_expiretime: Date.UTC(2026, 10, 4, 16) / 1000 }, now); assert.equal(r.active, true); assert.equal(r.until!.getTime(), Date.UTC(2026, 10, 4, 16)) })
test('string seconds from PHP', () => assert.equal(vipState({ vip_expiretime: String(now / 1000 + 60) }, now).active, true))
test('past -> not VIP', () => assert.equal(vipState({ vip_expiretime: now / 1000 - 1 }, now).active, false))
test('ms value tolerated', () => assert.equal(vipState({ vip_expiretime: now + 60000 }, now).active, true))
test('0 / null / missing / garbage', () => { for (const v of [0, null, undefined, '', 'x']) assert.deepEqual(vipState({ vip_expiretime: v }, now), { active: false, until: null }); assert.equal(vipState(null, now).active, false) })
test('stale is_vip=1 but expired -> not VIP', () => assert.equal(vipState({ is_vip: 1, vip_expiretime: now / 1000 - 5 }, now).active, false))
test('fmt', () => assert.match(fmtVipDate(new Date(2026, 10, 5, 0, 0)), /^2026-11-05 00:00$/))
