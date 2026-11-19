// Read-only API client. All calls hit api/index.php?r=...
import { begin, end } from './loading'
const BASE = './api/index.php'
export const tokenKey = 'mire_token'
export function getToken() { return localStorage.getItem(tokenKey) || '' }
export function logout() { localStorage.removeItem(tokenKey); localStorage.removeItem('mire_user'); location.hash = '#/login' }
export async function api<T = any>(r: string, params: Record<string, any> = {}, body?: any): Promise<T> {
  const q = new URLSearchParams({ r })
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') q.set(k, String(v)) })
  begin()  // FE-M4 全局 loading 计数
  try { return await call<T>(r, q, body) } finally { end() }
}
async function call<T>(r: string, q: URLSearchParams, body?: any): Promise<T> {
  const res = await fetch(`${BASE}?${q}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', ...(getToken() ? { 'X-Token': getToken() } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  // FE-M5（B21.3）：503 = 服务暂时不可用（维护/过载），只提示，不清登录态
  const E503 = () => { const e: any = new Error('服务暂时不可用，请稍后重试'); e.code = 503; return e }
  if (res.status === 503) throw E503()
  let j: any
  try { j = await res.json() } catch { throw new Error('接口返回异常 (HTTP ' + res.status + ')') }
  // B21.1：401 = 未登录或登录失效（登录接口的 401 = 账号或密码错误，不跳转）；403 = 已登录但无权限 / 账号停用，不清登录态
  if (j.code === 503) throw E503()
  if (j.code === 401 && r !== 'login') { logout(); throw new Error(j.msg || '登录已过期') }
  if (j.code !== 0) { const e: any = new Error(j.msg || (j.code === 403 ? '无权限' : j.code === 401 ? '账号或密码错误' : '请求失败')); e.code = j.code; throw e }   // B10: e.code === 403 -> 无权限提示
  return j.data
}
