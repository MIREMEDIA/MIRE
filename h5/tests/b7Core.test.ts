import { test } from 'node:test'
import assert from 'node:assert/strict'
import { generateKeyPairSync, privateDecrypt, constants } from 'node:crypto'
import * as C from '../src/api/b7Core.ts'
import { adPayload, parsePublicKey } from '../src/api/rsa.ts'
test('#12 api base: config > env > same origin, never a hardcoded host', () => {
  assert.equal(C.resolveApiBase('https://a.example/', 'https://b'), 'https://a.example')
  assert.equal(C.resolveApiBase('', 'https://b.example/'), 'https://b.example')
  assert.equal(C.resolveApiBase(undefined, undefined), '')
})
test('#4 spm / share url', () => {
  assert.equal(C.buildSpm(7, 'video', 12), '7.2.12.1.3')
  const u = C.buildShareUrl({ origin: 'https://h5.x', pathname: '/' }, { uid: 7, page: 'video', id: 12, linkSign: 'abc' })
  assert.equal(u, 'https://h5.x/?spm=7.2.12.1.3&link_sign=abc#/play/12')
  assert.equal(C.buildShareUrl({ origin: 'https://h5.x', pathname: '/' }, { page: 'home' }), 'https://h5.x/#/')
})
test('#5 invite code -> spm', () => {
  assert.equal(C.inviteSpm('7'), '7.1.0.1.3'); assert.equal(C.inviteSpm('7.2.1.1.3'), '7.2.1.1.3'); assert.equal(C.inviteSpm('abc'), ''); assert.equal(C.inviteSpm('0'), '')
  assert.equal(C.inviterOf('7.1.0.1.3'), 7)
})
test('#3 sign window keeps today inside 7 days', () => {
  const days = Array.from({ length: 30 }, (_, i) => ({ date: `2026-11-${String(i + 1).padStart(2, '0')}`, day: i + 1, score: 1 + (i % 7), is_sign: i < 9 ? 1 : 0, current: (i < 9 ? 'before' : i === 9 ? 'today' : 'after') as any }))
  const w = C.signWindow(days, 3); assert.equal(w.list.length, 7); assert.equal(w.list[w.todayIdx].current, 'today'); assert.equal(w.doneToday, false); assert.equal(w.todayIdx, 3)
})
test('#3 jobs flatten + activity', () => {
  const t = C.flattenJobs({ tasks: { daily: [{ id: 1, title: 'A', usable: 5, event: 'watch_videos', status: 0 }, { id: 2, title: 'B', usable: 3, event: 'custom_event', status: 2 }] } })
  assert.deepEqual(t.map(x => [x.action, x.to, x.category]), [['route', '/shorts', 'daily'], ['proof', '', 'daily']])
  const a = C.activityTasks({ share: { status: '1', limit: '3', usable: '10' }, ad: { status: '0', usable: '5' } })
  assert.equal(a.length, 1); assert.equal(a[0].action, 'share'); assert.equal(a[0].usable, 10)
})
test('#2 payment methods + server order state', () => {
  assert.deepEqual(C.payMethods({ payment: [{ type: 'paypal', status: 1 }, { type: 'apple', status: 1 }, { type: 'stripe', status: 0 }] }).map(x => x.type), ['paypal'])
  assert.deepEqual(C.payMethods({}), [])
  assert.equal((C as any).pendingLoad, undefined) // B8: no local unpaid-order cache
  assert.equal(C.orderState({ status: 0 }), 'unpaid'); assert.equal(C.orderState({ status: 1 }), 'paid'); assert.equal(C.orderState({ status: -1 }), 'closed')
})
test('#11 episode total / free-up-to never 0 from a shorts slide', () => {
  assert.equal(C.epTotal({ episodes: 0, episodes_list: [{}, {}] }), 2); assert.equal(C.epTotal({ episodes: 60 }), 60); assert.equal(C.epTotal({}), 0)
  assert.equal(C.freeUpTo([]), 0); assert.equal(C.freeUpTo([{ url: 'a' }, { url: '', price: 10 }]), 1)
  // B10 二批#5: EP1-3 free, EP4-6 cost 10; EP4/5 already unlocked (have url) must NOT make it "Free up to EP 5"
  const e6 = [0, 0, 0, 10, 10, 10].map((p, i) => ({ id: 100 + i, name: String(i + 1), price: p, url: i < 5 ? 'u' : null }))
  assert.equal(C.freeUpTo(e6), 3); assert.equal(C.freeUpTo(e6.map(e => ({ ...e, url: 'vip' }))), 3); assert.equal(C.freeUpTo(e6.slice(0, 3)), 3)
  // B10 二批#4: drama 191 — names 6..11 / admin episodes=11 but only 6 in the list -> "EP 6 / 6", never "EP 11 / 6"
  const d191 = [6, 7, 8, 9, 10, 11].map((n, i) => ({ id: 1910 + i, name: String(n), price: 0 }))
  assert.equal(C.epTotal({ episodes: 11 }, d191), 6); assert.equal(C.epPos(d191, d191[5]), 6); assert.equal(C.epPos(d191, d191[0]), 1)
  assert.equal(C.epPos([], { name: 'EP 4' }), 4); assert.equal(C.epPos([], { ep_no: 2, name: '9' }), 2); assert.equal(C.epTotal({ episodes_total: 6, episodes: 11 }), 6)
})
test('#8 #9 tip / withdraw checks', () => {
  assert.equal(C.tipError(0, 10), 'invalid'); assert.equal(C.tipError(1.5, 10), 'invalid'); assert.equal(C.tipError(20, 10), 'balance'); assert.equal(C.tipError(5, 10), '')
  assert.equal(C.withdrawCheck({ min: 10, max: 100 }, 5), 'min'); assert.equal(C.withdrawCheck({ min: 10, max: 100 }, 500), 'max'); assert.equal(C.withdrawCheck({}, -1), 'invalid')
  assert.equal(C.withdrawFee({ service_fee: 2 }, 50), 1)
})
test('#10 content language follows UI', () => {
  const s = [{ lang: 'en-us' }, { lang: 'zh-TW' }, { lang: 'ar' }]
  assert.equal(C.contentLangFor('ar', s), 'ar'); assert.equal(C.contentLangFor('zh-TW', s), 'zh-TW'); assert.equal(C.contentLangFor('en', s), 'en-us'); assert.equal(C.contentLangFor('th', s), '')
})
test('#6 server list rows', () => {
  const r = C.mapLogRow({ vid: 3, episode_id: 9, video: { id: 3, title: 'T', image: 'i', episodes: 10 }, createtime: '2026-11-03 10:00:00' })
  assert.equal(r.id, 3); assert.equal(r.title, 'T'); assert.ok(r.t > 0)
  assert.deepEqual(C.pageRows({ data: [1] }), [1]); assert.deepEqual(C.pageRows(null), [])
})
test('#1 ad payload = urlsafe(base64(RSA-PKCS1v1.5(base64(JSON)))) decryptable by the FA private key', () => {
  for (const type of ['spki', 'pkcs1'] as const) {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048, publicKeyEncoding: { type, format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } })
    assert.equal(parsePublicKey(publicKey).k, 256)
    const obj = { ad_id: 5, type: 'unlock', vid: 3, episode_id: 9, time: 1762135200 }
    const data = adPayload(publicKey, obj)
    assert.match(data, /^[A-Za-z0-9_-]+$/)
    const b64 = data.replace(/-/g, '+').replace(/_/g, '/')
    const plain = privateDecrypt({ key: privateKey, padding: constants.RSA_PKCS1_PADDING }, Buffer.from(b64, 'base64')).toString()
    assert.deepEqual(JSON.parse(Buffer.from(plain, 'base64').toString()), obj)
  }
})
