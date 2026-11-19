import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as C from '../src/api/b7Core.ts'

test('B9#1 tip rule normalise + limits', () => {
  assert.deepEqual(C.normTipRule(null), C.TIP_DEFAULT)
  const r = C.normTipRule({ min: 2, max: 10, presets: [10, 2, 50, 5, 5] })
  assert.equal(r.min, 2); assert.equal(r.max, 10); assert.deepEqual(r.presets, [2, 5, 10])
  assert.deepEqual(C.normTipRule({ min: 5, max: 1 }), C.TIP_DEFAULT)
  assert.equal(C.tipError(1, 100, C.TIP_DEFAULT), '')
  assert.equal(C.tipError(10, 100, C.TIP_DEFAULT), 'max')
  assert.equal(C.tipError(0, 100, C.TIP_DEFAULT), 'invalid')
  assert.equal(C.tipError(5, 3, C.TIP_DEFAULT), 'balance')
  assert.equal(C.tipError(1, 100, { min: 2, max: 5 }), 'min')
})
test('B9#4 withdraw methods objects + currencies', () => {
  assert.deepEqual(C.wdMethods({ methods: [{ name: 'Bank card', type: 'bank' }, { name: 'X', type: 'bank' }, 'alipay'] }), [{ type: 'bank', name: 'Bank card' }, { type: 'alipay', name: 'alipay' }])
  assert.deepEqual(C.wdMethods({ methods: { a: { type: 'wechat', name: 'WeChat' } } }), [{ type: 'wechat', name: 'WeChat' }])
  assert.deepEqual(C.wdMethods(null), [])
  const c = C.wdCurrencies({ currency_exchange_rate: [{ currency: 'usd', exchange_rate: 100 }, { currency: '', exchange_rate: 5 }, { currency: 'MYR', exchange_rate: 0 }, { currency: 'USD', exchange_rate: 1 }] })
  assert.equal(c.length, 1); assert.equal(c[0].currency, 'USD'); assert.equal(c[0].rate, 100)
  assert.deepEqual(C.wdCurrencies({}), [])
})
test('B9#2/#7 password rule + has_password', () => {
  assert.deepEqual(C.pwdRuleOf({}), { min: 6, max: 30 })
  assert.deepEqual(C.pwdRuleOf({ pwd_rule: { min: 8, max: 20 } }), { min: 8, max: 20 })
  assert.equal(C.pwdError('12345'), 'len'); assert.equal(C.pwdError('123456'), ''); assert.equal(C.pwdError('x'.repeat(30)), ''); assert.equal(C.pwdError('x'.repeat(31)), 'len')
  assert.equal(C.pwdError('abc def1'), 'space'); assert.equal(C.pwdError('x'.repeat(17)), '') // old 6–16 limit gone
  assert.equal(C.hasPassword({ has_password: 0 }), false); assert.equal(C.hasPassword({ has_password: 1 }), true); assert.equal(C.hasPassword({}), true)
})
test('B9#6 safe redirect', () => {
  assert.equal(C.safeRedirect('/me', '/x'), '/me')
  assert.equal(C.safeRedirect(undefined, '/play/3?ep=2'), '/play/3?ep=2')
  assert.equal(C.safeRedirect('//evil.test', '/login'), '/')
  assert.equal(C.safeRedirect('https://evil.test', null), '/')
  assert.equal(C.safeRedirect('/forgot', '/login?x=1'), '/')
  assert.equal(C.safeRedirect('/loginx', null), '/loginx')
})
test('B9#8 invite from link', () => {
  assert.equal(C.inviteFromLink({ invite: '123' }, null), '123')
  assert.equal(C.inviteFromLink({ spm: '42.1.0.1.3' }, null), '42')
  assert.equal(C.inviteFromLink({}, '77.1.0.1.3'), '77')
  assert.equal(C.inviteFromLink({}, null), '')
})
