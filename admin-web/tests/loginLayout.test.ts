import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('../src/views/Login.vue', import.meta.url), 'utf8')
const style = src.slice(src.indexOf('<style'))

test('desktop login stays a side-by-side row', () => {
  const desktop = style.split('@media (max-width: 767px)')[0]
  assert.match(desktop, /\.wrap\{display:flex;height:100vh\}/)
  assert.match(desktop, /\.card\{width:360px\}/)
  assert.doesNotMatch(desktop, /\.wrap\{[^}]*flex-direction:column/)
})

test('phone login stacks and does not keep a fixed 360px card', () => {
  const mobile = style.split('@media (max-width: 767px)')[1] || ''
  assert.match(mobile, /flex-direction:column/)
  assert.match(mobile, /box-sizing:border-box/)
  assert.match(mobile, /\.card\{width:100%;max-width:420px\}/)
  assert.match(src, /async function submit\(\)/)
  assert.match(src, /请输入账号和密码/)
})
