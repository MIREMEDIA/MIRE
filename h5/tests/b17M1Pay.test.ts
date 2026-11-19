import { test } from 'node:test'
import assert from 'node:assert/strict'
import { payMethods, methodSupports, listCurrency } from '../src/api/b7Core.ts'
import { PayError, payErrorText } from '../src/payError.ts'
const t = (k: string, p?: any) => k + (p ? JSON.stringify(p) : '')
const init = { payment: [{ type: 'paypal', name: 'PayPal', status: 1 }, { type: 'm1pay', name: 'M1pay', currencies: ['MYR'] }, { type: 'stripe', name: 'Stripe' }] }
const types = (c?: string, i: any = init) => payMethods(i, c).map(m => m.type)
test('myr_only: m1pay hidden for USD package', () => assert.deepEqual(types('USD'), ['paypal', 'stripe']))
test('myr_only: m1pay shown for MYR package (case-insensitive)', () => { assert.deepEqual(types('MYR'), ['paypal', 'm1pay', 'stripe']); assert.deepEqual(types('myr'), ['paypal', 'm1pay', 'stripe']) })
test('convert: currencies list from server decides', () => { const i = { payment: [{ type: 'm1pay', currencies: ['MYR', 'USD'] }] }; assert.deepEqual(types('USD', i), ['m1pay']); assert.deepEqual(types('VND', i), []) })
test('unknown currency (old FA without `currency`) -> no client filtering, server still rejects', () => assert.deepEqual(types(''), ['paypal', 'm1pay', 'stripe']))
test('method without `currencies` (old FA / other gateways) is never filtered', () => { assert.equal(methodSupports({ type: 'm1pay' }, 'USD'), true); assert.equal(methodSupports({ type: 'x', currencies: 'MYR' }, 'USD'), true) })
test('listCurrency reads Vip/Usable index currency', () => { assert.equal(listCurrency({ currency: ' usd ' }), 'USD'); assert.equal(listCurrency({ list: [] }), ''); assert.equal(listCurrency(null), ''); assert.equal(listCurrency({ currency: 5 }), '') })
test('server m1pay_currency reject -> localized message naming the currency', () => {
  const e = new PayError('pay', 0, 'M1Pay only supports MYR-priced packages (this package is priced in USD)', { reason: 'm1pay_currency', currency: 'USD', mode: 'myr_only' })
  assert.equal(payErrorText(e, t), 'b16.pay.m1payCurrency{"cur":"USD"}')
})
test('apple still excluded', () => assert.deepEqual(types('MYR', { payment: [{ type: 'applepay' }, { type: 'm1pay', currencies: ['MYR'] }] }), ['m1pay']))
