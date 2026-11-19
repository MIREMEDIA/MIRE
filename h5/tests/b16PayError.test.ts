import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PayError, cleanMsg, isPayOk, payErrorText, payCall, redirectUrl } from '../src/payError.ts'
const t = (k: string, p?: any) => k + (p ? JSON.stringify(p) : '')
const STRIPE = "Checkout Session's total amount must convert to at least 200 sen. $0.01 converts to approximately RM0.04."
test('code 0 from pay/paypal -> PayError(pay) with the server msg', async () => {
  await assert.rejects(payCall(async () => ({ code: 0, msg: STRIPE, data: null }), 'pay', '/pay/paypal', {}), (e: any) => e.name === 'PayError' && e.stage === 'pay' && e.code === 0 && e.serverMsg === STRIPE)
})
test('server msg shown verbatim (that is what H5 must display)', () => assert.equal(payErrorText(new PayError('pay', 0, STRIPE), t), STRIPE))
test('empty / missing msg -> generic localized', () => { for (const r of [{ code: 0 }, { code: 0, msg: '' }, { code: 0, msg: '   ' }, { code: 0, msg: 12 }, null, 'x']) assert.equal(payErrorText(new PayError('order', 0, cleanMsg(r)), t), 'b16.pay.failed') })
test('network error (fetch throws) -> network text', async () => {
  await assert.rejects(payCall(async () => { throw new TypeError('Failed to fetch') }, 'order', '/vip_order/recharge', {}), (e: any) => e.stage === 'network')
  assert.equal(payErrorText(new PayError('network'), t), 'b16.pay.network')
})
test('HTTP error body / HTML 500 -> not ok, tags stripped', async () => {
  await assert.rejects(payCall(async () => ({ code: 500, msg: '<html><b>Internal</b> Server Error</html>', data: null }), 'pay', '/pay/paypal', {}), (e: any) => e.serverMsg === 'Internal Server Error' && e.code === 500)
})
test('code 401 / "1" string / missing code', async () => {
  assert.equal(isPayOk({ code: '1' }), true); assert.equal(isPayOk({ code: 401 }), false); assert.equal(isPayOk({}), false); assert.equal(isPayOk(null), false)
})
test('below_min structured reason -> localized with min', () => assert.equal(payErrorText(new PayError('pay', 0, 'x', { reason: 'below_min', currency: 'USD', min: '0.50' }), t), 'b16.pay.belowMin{"min":"USD 0.50"}'))
test('no redirect url -> redirect text', () => { assert.equal(redirectUrl('stripe', { code: 1, data: { pay_data: {} } }), ''); assert.equal(payErrorText(new PayError('redirect'), t), 'b16.pay.noRedirect') })
test('redirect url per channel', () => {
  assert.equal(redirectUrl('paypal', { data: { pay_data: { links: [{}, { href: 'https://p' }] } } }), 'https://p')
  assert.equal(redirectUrl('stripe', { data: { pay_data: { url: 'https://s' } } }), 'https://s')
  assert.equal(redirectUrl('m1pay', { data: { pay_data: { redirectUrl: 'https://m' } } }), 'https://m')
  assert.equal(redirectUrl('x', { data: { pay_data: { params: { url: 'https://x' } } } }), 'https://x')
})
test('non-PayError -> generic', () => { assert.equal(payErrorText(new Error('boom'), t), 'b16.pay.failed'); assert.equal(payErrorText(undefined, t), 'b16.pay.failed') })
test('long msg capped', () => assert.ok(cleanMsg({ msg: 'a'.repeat(1000) }).length <= 301))
test('ok passes through', async () => assert.deepEqual(await payCall(async () => ({ code: 1, data: { order_sn: 'A' } }), 'order', '/x', {}), { code: 1, data: { order_sn: 'A' } }))
