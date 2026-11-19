// FE-M8 单测：node --test（Node 24 原生剥离 TS 类型）
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { LOG_TYPE_ZH, logTypeOf, logTypeLabel, logTitle, filterTypes } from '../src/logtypes.ts'
const src = (p: string) => readFileSync(new URL('../src/' + p, import.meta.url), 'utf8')
test('qa_magic_login（后端 other）显示 QA一次性登录', () => {
  const r = { type: 'other', url: '/api/index.php?r=qa_magic_login', title: 'qa_magic_login' }
  assert.equal(logTypeLabel(logTypeOf(r)), 'QA一次性登录'); assert.equal(logTitle(r), 'QA一次性登录')
  assert.equal(logTypeLabel(logTypeOf({ type: 'other', url: '/api/index.php?x=1&r=qa_magic_login' })), 'QA一次性登录')
})
test('后端所有可能 type 都有中文', () => {
  for (const k of ['login', 'b1', 'b3', 'b4', 'b8', 'b9', 'b10', 'b18', 'profile', 'cc', 'fa', 'other', 'qa_magic_login']) assert.match(LOG_TYPE_ZH[k], /[\u4e00-\u9fa5]/, k)
  assert.equal(logTypeLabel('other'), '其他'); assert.equal(logTypeLabel('zzz'), '其他（zzz）'); assert.equal(logTypeLabel(''), '—')
})
test('meta 标签优先，meta 只给 key 时回落中文', () => {
  assert.equal(logTypeLabel('b10', [{ value: 'b10', label: 'B10 后端名' }]), 'B10 后端名')
  assert.equal(logTypeLabel('cc', [{ value: 'cc', label: 'cc' }]), '创作中心权限')
  assert.equal(logTypeOf({ type: 'b8', url: '/api/index.php?r=b8.wd' }), 'b8')
})
test('筛选项：补齐 b3/cc，不含 other/qa_magic_login', () => {
  const v = filterTypes([{ value: 'login', label: '登录' }]).map(x => x.value)
  for (const k of ['login', 'b3', 'cc', 'fa', 'b18']) assert.ok(v.includes(k), k)
  assert.ok(!v.includes('other') && !v.includes('qa_magic_login'))
})
test('退款按钮禁用时不再是 warning', () => {
  const s = src('views/b10/B10Crud.vue')
  assert.match(s, /type: refundOff\(r\) \? 'default' : 'warning', disabled: refundOff\(r\)/)
  assert.doesNotMatch(s, /type: 'warning', disabled: !canW/)
})
test('评论权重框无编辑权限时 disabled（手机+桌面）', () => {
  const s = src('views/B4Comments.vue'); const ins = s.match(/<n-input-number v-model:value="weighEdit[^>]*>/g) || []
  assert.equal(ins.length, 2); for (const x of ins) assert.match(x, /:disabled="d\.writable !== true/)
})
