import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as B from '../src/api/b10Core.ts'
import * as C from '../src/api/b7Core.ts'

test('B10#6 ad unlock follows play order', () => {
  const L = [{ id: 11, name: '1', price: 0, url: '/a.mp4' }, { id: 12, name: '2', price: 10, url: null }, { id: 13, name: '3', price: 10, url: null }]
  assert.equal(B.firstLockedBefore(L, 11), null)
  assert.equal(B.firstLockedBefore(L, 12), null)            // next locked one may be unlocked
  const h = B.firstLockedBefore(L, 13)!; assert.equal(h.index, 2); assert.equal(B.epLabel(h), '2')
  L[1].url = '/b.mp4' as any; assert.equal(B.firstLockedBefore(L, 13), null)
  assert.equal(B.firstLockedBefore([{ id: 1, price: 5, url: '' }, { id: 2, price: 5, url: '' }], 2)!.index, 1)
  assert.equal(B.epLabel({ index: 4, ep: { name: '' } }), '4')
  assert.equal(B.firstLockedBefore([], 3), null); assert.equal(B.firstLockedBefore(L, 999), null)
})
test('B10#7 withdraw methods = array of objects + currency in apply body', () => {
  const rule = { methods: [{ name: 'Bank card', type: 'bank' }, { name: 'PayPal', type: 'paypal' }, { name: 'dup', type: 'bank' }, { type: '' }, null], currency_exchange_rate: [{ currency: 'usd', exchange_rate: 100 }] }
  assert.deepEqual(C.wdMethods(rule), [{ type: 'bank', name: 'Bank card' }, { type: 'paypal', name: 'PayPal' }])
  assert.deepEqual(C.wdMethods({ methods: [{ type: 'alipay' }] }), [{ type: 'alipay', name: 'alipay' }])
  const cur = C.wdCurrencies(rule)[0].currency
  assert.deepEqual(B.wdApplyBody('bank', 12.5, cur), { type: 'bank', money: 12.5, currency: 'USD', platform: 'H5' })
  assert.deepEqual(B.wdApplyBody('paypal', 3, ' myr '), { type: 'paypal', money: 3, currency: 'MYR', platform: 'H5' })
  assert.equal(B.wdApplyBody('bank', 10, ''), null); assert.equal(B.wdApplyBody('', 10, 'USD'), null); assert.equal(B.wdApplyBody('bank', 0, 'USD'), null)
})
test('B10 二批#7 tip request id: FA format, unique per tap', () => {
  const ids = new Set<string>(); for (let i = 0; i < 200; i++) { const id = B.tipReqId(); assert.match(id, /^[A-Za-z0-9_.-]{6,40}$/); ids.add(id) }
  assert.equal(ids.size, 200)
  assert.notEqual(B.tipReqId(() => 0.1, () => 1000), B.tipReqId(() => 0.2, () => 1000))
})
test('B10 二批#4 epLabel uses play position, not the raw name (drama 191)', () => {
  const L = [6, 7, 8, 9, 10, 11].map((n, k) => ({ id: 1911 + k, name: String(n), price: k < 3 ? 0 : 10, url: k < 3 ? 'u' : '' }))
  const h = B.firstLockedBefore(L, 1916)!; assert.equal(h.index, 4); assert.equal(B.epLabel(h), '4')
})
