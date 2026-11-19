import { test } from 'node:test'
import assert from 'node:assert/strict'
import { firstEligible, isFirst, effectivePrice } from '../src/vipFirst.ts'
const m = { id: 1, type: 'm', price: '9.99', first_price: '1.99' }
test('eligibility only from server flag === true', () => { assert.equal(firstEligible({ first_eligible: true }), true); for (const d of [{}, null, undefined, { first_eligible: 1 }, { first_eligible: 'true' }, { first_eligible: false }]) assert.equal(firstEligible(d), false) })
test('eligible + first_price>0 -> first price', () => { assert.equal(isFirst(m, true), true); assert.equal(effectivePrice(m, true), '1.99') })
test('not eligible -> price, first hidden', () => { assert.equal(isFirst(m, false), false); assert.equal(effectivePrice(m, false), '9.99') })
test('first_price null / 0 / negative -> price', () => { for (const fp of [null, undefined, '0.00', 0, '-1', 'x']) { const v = { ...m, first_price: fp as any }; assert.equal(isFirst(v, true), false); assert.equal(effectivePrice(v, true), '9.99') } })
test('server first_available=false wins', () => { const v = { ...m, first_available: false }; assert.equal(isFirst(v, true), false); assert.equal(effectivePrice(v, true), '9.99') })
test('server pay_price used when eligible', () => { assert.equal(effectivePrice({ ...m, first_available: true, pay_price: '1.99' }, true), '1.99'); assert.equal(effectivePrice({ ...m, first_available: false, pay_price: '9.99' }, true), '9.99') })
test('pay_price ignored when not eligible', () => assert.equal(effectivePrice({ ...m, pay_price: '1.99' }, false), '9.99'))
