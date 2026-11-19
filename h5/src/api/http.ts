import { useUser } from '../stores/user'
import { resolveApiBase } from './b7Core'
const cfg = (window as any).MIRE_CONFIG || {}
// B7 #12: no fixed host. MIRE_CONFIG.apiBase (index.html, per deployment) > VITE_API_BASE (build) > '' = same origin as the page
export const API_BASE: string = resolveApiBase(cfg.apiBase, import.meta.env.VITE_API_BASE)
/** Lang header for content & prices. Fixed => identical package/price set in every UI language. */
const DEF_LANG: string = cfg.contentLang ?? import.meta.env.VITE_CONTENT_LANG ?? 'en-us'
// B1 #24: with MIRE_CONFIG.serverLangs the content language can be picked from /index/lang_list (vs_lang, admin-editable)
export const CONTENT_LANG: string = (cfg.serverLangs && localStorage.getItem('mire_content_lang')) || DEF_LANG
export const PRICE_LANG = DEF_LANG // B7: prices/packages always use the fixed default Lang (identical in every UI/content language)
export interface Resp<T = any> { code: number; msg: string; data: T }
export async function request<T = any>(path: string, opts: { method?: 'GET' | 'POST'; params?: Record<string, any>; body?: Record<string, any>; lang?: string } = {}): Promise<Resp<T>> {
  const user = useUser()
  const method = opts.method || 'GET'
  let url = `${API_BASE}/addons/dramas${path}`
  if (opts.params) { const q = new URLSearchParams(Object.entries(opts.params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])); if ([...q].length) url += '?' + q }
  const headers: Record<string, string> = { Token: user.token || '', Lang: opts.lang || CONTENT_LANG, Platform: 'H5', Channel: user.channel || '', Tscode: '' }
  // form encoding: backend CORS allow-headers lacks content-type, so JSON POST would fail preflight cross-origin
  if (method === 'POST') headers['Content-Type'] = 'application/x-www-form-urlencoded'
  const r = await fetch(url, { method, headers, body: method === 'POST' ? new URLSearchParams(Object.entries(opts.body || {}).map(([k, v]) => [k, String(v ?? '')])) : undefined })
  const j = await r.json().catch(() => ({ code: r.status, msg: r.statusText, data: null }))
  if (r.status === 401 || j.code === 401) { user.needLogin = true }
  return j
}
