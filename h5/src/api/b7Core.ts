// B7 pure helpers (no Vue / no fetch) — unit-tested in tests/b7Core.test.ts
/** #12: API base = MIRE_CONFIG.apiBase, else build-time VITE_API_BASE, else '' (same origin as the page). Never a fixed host. */
export function resolveApiBase(cfgBase: unknown, envBase: unknown): string {
  const v = [cfgBase, envBase].find(x => typeof x === 'string' && x.trim() !== '') as string | undefined
  return (v ?? '').trim().replace(/\/+$/, '')
}
// ---- #4/#5 share & invite (FA Share model spm = shareUserId.page.pageId.platform.from) ----
export const SPM_PAGE = { home: 1, video: 2 } as const
export const SPM_FROM = { forward: 1, poster: 2, link: 3 } as const
export const PLATFORM_H5 = 1
export function buildSpm(uid: number | string, page: 'home' | 'video', pageId: number | string = 0, from: keyof typeof SPM_FROM = 'link') {
  return `${uid || 0}.${SPM_PAGE[page]}.${pageId || 0}.${PLATFORM_H5}.${SPM_FROM[from]}`
}
/** share URL: query (spm, link_sign) BEFORE the hash so FA/uni links and our main.ts both read it from location.search */
export function buildShareUrl(base: { origin: string; pathname: string }, o: { uid?: number | string; page: 'home' | 'video'; id?: number | string; linkSign?: string; from?: keyof typeof SPM_FROM }) {
  const q = new URLSearchParams()
  if (o.uid) q.set('spm', buildSpm(o.uid, o.page, o.id, o.from))
  if (o.linkSign) q.set('link_sign', o.linkSign)
  const qs = [...q].length ? '?' + q.toString() : ''
  return `${base.origin}${base.pathname}${qs}#${o.page === 'video' && o.id ? `/play/${o.id}` : '/'}`
}
/** invite code (= sharer user id) typed at registration -> spm the backend's register_after hook understands */
export function inviteSpm(code: string): string {
  const c = String(code || '').trim()
  if (/^\d+(\.\d+){4}$/.test(c)) return c
  return /^\d{1,12}$/.test(c) && c !== '0' ? buildSpm(c, 'home', 0, 'link') : ''
}
export const inviterOf = (spm: string) => { const m = /^(\d+)\./.exec(spm || ''); return m ? Number(m[1]) : 0 }
// ---- #3 check-in (FA UserSignService::getList days[]) ----
export interface SignDay { date: string; day: number; score: number; is_sign: number; current: 'before' | 'today' | 'after'; is_discount?: number }
/** 7-day strip: starts at the first day of the running streak (so today is inside), from the backend's month calendar */
export function signWindow(days: SignDay[], continueDays: number): { list: SignDay[]; todayIdx: number; doneToday: boolean } {
  const ti = days.findIndex(d => d.current === 'today'); if (ti < 0) return { list: days.slice(0, 7), todayIdx: -1, doneToday: false }
  const doneToday = !!days[ti].is_sign
  const before = Math.max(0, Number(continueDays || 0) - (doneToday ? 1 : 0))
  const start = Math.max(0, ti - Math.min(before, 6)); const list = days.slice(start, start + 7)
  return { list, todayIdx: ti - start, doneToday }
}
// ---- #3 tasks (FA Job::index -> tasks grouped by category; status 0 todo,1 done,2 upload proof,3 reviewing,4 go/recharge) ----
export type TaskAction = 'route' | 'share' | 'ad' | 'proof' | 'none'
export interface Task { id: number | string; title: string; usable: number; type: string; event: string; category: string; status: number; action: TaskAction; to: string; icon: string; desc: string; limit: number }
const EVT: Record<string, { action: TaskAction; to: string; icon: string }> = {
  bind_phone: { action: 'route', to: '/settings', icon: 'user' }, bind_email: { action: 'route', to: '/settings', icon: 'mail' },
  user_recharge: { action: 'route', to: '/wallet', icon: 'wallet' }, watch_videos: { action: 'route', to: '/shorts', icon: 'tv' },
  user_register: { action: 'route', to: '/login', icon: 'user' }, custom_event: { action: 'proof', to: '', icon: 'doc' },
  share: { action: 'share', to: '/invite', icon: 'share' }, share_success: { action: 'share', to: '/invite', icon: 'share' }, ad: { action: 'ad', to: '', icon: 'tv' },
}
export function flattenJobs(data: any): Task[] {
  const raw = data?.tasks; const groups: [string, any[]][] = Array.isArray(raw) ? [['', raw]] : Object.entries(raw || {}).map(([k, v]) => [k, Array.isArray(v) ? v : Object.values(v || {})])
  const out: Task[] = []
  for (const [cat, arr] of groups) for (const x of arr) {
    const ev = String(x.event ?? x.hook ?? ''); const m = EVT[ev] || { action: 'none' as TaskAction, to: '', icon: 'gift' }
    out.push({ id: x.id, title: String(x.title ?? x.name ?? ''), usable: Number(x.usable ?? 0), type: String(x.type ?? ''), event: ev, category: String(x.category ?? cat), status: Number(x.status ?? 0), action: m.action, to: m.to, icon: m.icon, desc: String(x.desc ?? x.remark ?? ''), limit: Number(x.limit ?? 1) || 1 })
  }
  return out
}
/** share / ad come from Job::index `activity` ({status, limit, usable}); status==1 -> show a task card */
export function activityTasks(act: any): Task[] {
  const out: Task[] = []
  for (const k of ['share', 'ad']) { const a = act?.[k]; if (a && String(a.status) === '1' && Number(a.usable) > 0) out.push({ id: 'act-' + k, title: '', usable: Number(a.usable), type: 'day', event: k, category: 'activity', status: 0, action: k as TaskAction, to: k === 'share' ? '/invite' : '', icon: k === 'share' ? 'share' : 'tv', desc: '', limit: Number(a.limit) || 0 }) }
  return out
}
// ---- #2 payment methods from /index/init payment ----
/** B17: currency of a package list response (FA Vip/Usable index `currency`, from the language); '' when unknown */
export const listCurrency = (d: any): string => (typeof d?.currency === 'string' ? d.currency.trim().toUpperCase() : '')
/** B17: a method that declares `currencies` (M1Pay: MYR only unless the admin enabled conversion) is hidden for other currencies */
export function methodSupports(m: any, currency?: string): boolean {
  const c = String(currency || '').trim().toUpperCase(); const l = m?.currencies
  if (!c || !Array.isArray(l)) return true
  return l.map((x: any) => String(x).toUpperCase()).includes(c)
}
export function payMethods(init: any, currency?: string): { type: string; name: string; logo: string }[] {
  const p = init?.payment; const arr = Array.isArray(p) ? p : Object.values(p || {})
  return arr.filter((m: any) => m && m.type && !/apple/i.test(String(m.type)) && String(m.status ?? '1') !== '0' && methodSupports(m, currency)).map((m: any) => ({ type: String(m.type), name: String(m.name || m.type), logo: String(m.logo || m.image || '') }))
}
// ---- #2 unpaid orders: B8 — FA /usable/order_list & /vip_order/index return unpaid orders with include_unpaid=1 (server is the source of truth) ----
/** FA order status: 0 unpaid, 1 paid, 2 completed, -1 closed/cancelled, -2 expired (pay_status may also be used) */
export const PENDING_LEGACY_KEY = 'mire_pending_orders'
export const orderState = (o: any): 'unpaid' | 'paid' | 'closed' => { const s = Number(o?.status ?? 0); return s >= 1 ? 'paid' : s < 0 ? 'closed' : 'unpaid' }
// ---- #11 episode count / free-up-to label ----
// B10 二批#4: total = the real episode list when we have it (drama.episodes is an admin-typed number and can disagree: "EP 11 / 6")
export function epTotal(drama: any, eps: any[] = []): number { const l = eps.length || (Array.isArray(drama?.episodes_list) ? drama.episodes_list.length : 0); if (l > 0) return l; const n = Number(drama?.episodes_total ?? drama?.episodes) || 0; return n > 0 ? n : 0 }
/** B10 二批#4: 1-based play position of an episode in the list (FA order weigh desc, id asc); falls back to FA ep_no / digits of name */
export function epPos(eps: any[], ep: any): number { const i = (eps || []).findIndex(e => Number(e?.id) === Number(ep?.id)); if (i >= 0) return i + 1; const n = Number(ep?.ep_no) || Number(String(ep?.name ?? '').replace(/\D+/g, '')); return n > 0 ? n : 0 }
// B10 二批#5: "Free up to EP n" = leading run of price 0 episodes in play order. Ignores url: an episode the user already
// unlocked / VIP has a url but still costs coins for others, so it must not extend the free label.
export function freeUpTo(eps: any[]): number { if (!eps.length) return 0; const i = eps.findIndex(e => Number(e?.price) > 0); return i < 0 ? eps.length : i }
// ---- #8 tip ----
export interface TipRule { min: number; max: number; presets: number[] }
/** B9 #1: FA /video/tipRule (admin "打赏配置", mire_tip_rule) -> safe rule; default = CTO 1–5 */
export const TIP_DEFAULT: TipRule = { min: 1, max: 5, presets: [1, 2, 3, 5] }
export function normTipRule(d: any): TipRule {
  let min = Math.floor(Number(d?.min)); let max = Math.floor(Number(d?.max))
  if (!(min >= 1) || !(max >= min)) { min = TIP_DEFAULT.min; max = TIP_DEFAULT.max }
  let p = (Array.isArray(d?.presets) ? d.presets : TIP_DEFAULT.presets).map((x: any) => Math.floor(Number(x))).filter((x: number) => x >= min && x <= max)
  p = [...new Set<number>(p)].sort((a, b) => a - b).slice(0, 8)
  if (!p.length) p = [...new Set([min, max])]
  return { min, max, presets: p }
}
export function tipError(num: number, balance: number, rule?: { min: number; max: number }): '' | 'invalid' | 'min' | 'max' | 'balance' {
  if (!Number.isInteger(num) || num <= 0) return 'invalid'
  if (rule && num < rule.min) return 'min'
  if (rule && num > rule.max) return 'max'
  if (num > balance) return 'balance'; return ''
}
// ---- #9 withdraw ----
export function withdrawCheck(rule: any, money: number): '' | 'min' | 'max' | 'invalid' { if (!(money > 0)) return 'invalid'; const min = Number(rule?.min) || 0; const max = Number(rule?.max) || 0; if (min && money < min) return 'min'; if (max && money > max) return 'max'; return '' }
/** B9 #4: FA rule.methods is [{name,type}] (older builds: ['bank']) -> [{type,name}] */
export function wdMethods(rule: any): { type: string; name: string }[] {
  const arr = Array.isArray(rule?.methods) ? rule.methods : Object.values(rule?.methods || {})
  const out: { type: string; name: string }[] = []
  for (const m of arr) {
    const type = typeof m === 'string' ? m : String(m?.type ?? '')
    if (type && !out.some(x => x.type === type)) out.push({ type, name: typeof m === 'string' ? m : String(m?.name || type) })
  }
  return out
}
/** B9 #4: rule.currency_exchange_rate [{currency, exchange_rate}] -> usable currencies (code set, rate > 0, unique) */
export function wdCurrencies(rule: any): { currency: string; rate: number }[] {
  const out: { currency: string; rate: number }[] = []
  for (const x of (Array.isArray(rule?.currency_exchange_rate) ? rule.currency_exchange_rate : [])) {
    const c = String(x?.currency ?? '').trim().toUpperCase(); const r = Number(x?.exchange_rate)
    if (c && r > 0 && !out.some(o => o.currency === c)) out.push({ currency: c, rate: r })
  }
  return out
}
export const withdrawFee = (rule: any, money: number) => Math.round(money * (Number(rule?.service_fee) || 0)) / 100
// ---- #10 content language follows UI language (fixes the ar/zh-TW mixed home page) ----
export function contentLangFor(ui: string, server: { lang: string }[]): string {
  const u = ui.toLowerCase(); const codes = server.map(s => String(s.lang))
  const hit = codes.find(c => c.toLowerCase() === u) || codes.find(c => c.toLowerCase().startsWith(u + '-')) || codes.find(c => c.toLowerCase().split('-')[0] === u.split('-')[0])
  return hit || ''
}
// ---- #6 server favourites / history rows -> list items ----
export function mapLogRow(x: any) { const v = x?.video || x || {}; const e = x?.episode || {}; return { id: Number(v.id ?? x.vid), title: String(v.title ?? ''), image: String(v.image ?? ''), ep: Number(String(e.name ?? x.episodes_name ?? '').replace(/\D+/g, '')) || 1, episodes: Number(v.episodes) || 0, episodeId: Number(x.episode_id ?? e.id ?? 0) || 0, t: toMs(x.updatetime ?? x.createtime) } }
const toMs = (v: any) => { if (v == null || v === '') return 0; if (/^\d+$/.test(String(v))) return Number(v) * 1000; const d = Date.parse(String(v).replace(' ', 'T')); return isNaN(d) ? 0 : d }
export function pageRows(d: any): any[] { return Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [] }
// ---- B9 #7 password rule: backend (FA User::PWD_MIN/PWD_MAX, \S{6,30}) is the source of truth; /user/index returns pwd_rule ----
export const PWD_DEFAULT = { min: 6, max: 30 }
export function pwdRuleOf(info: any): { min: number; max: number } { const r = info?.pwd_rule; const min = Number(r?.min); const max = Number(r?.max); return min >= 1 && max >= min ? { min, max } : { ...PWD_DEFAULT } }
export function pwdError(p: string, rule = PWD_DEFAULT): '' | 'len' | 'space' { if (/\s/.test(p)) return 'space'; const n = [...p].length; return n < rule.min || n > rule.max ? 'len' : '' }
/** B9 #2: /user/index has_password (verification.password); missing -> assume set (old FA) */
export const hasPassword = (info: any) => info?.has_password === undefined || info?.has_password === null ? true : !!Number(info.has_password)
// ---- B9 #6 post-login redirect: only in-app paths, never back to /login or /forgot ----
export function safeRedirect(q: unknown, back: unknown): string {
  const ok = (v: unknown) => typeof v === 'string' && /^\/(?!\/)/.test(v) && !/^\/(login|forgot)(\b|\/|\?|$)/.test(v) && !/[\\]|^\/\w+:/.test(v)
  if (ok(q)) return q as string
  if (ok(back)) return back as string
  return '/'
}
// ---- B9 #8 invite code to prefill: ?invite= / ?code= > stored spm (link / share) -> sharer id ----
export function inviteFromLink(q: { invite?: unknown; code?: unknown; spm?: unknown }, storedSpm: string | null): string {
  for (const v of [q.invite, q.code]) { const s = String(Array.isArray(v) ? v[0] : v ?? '').trim(); if (inviteSpm(s)) return s }
  const sp = String(Array.isArray(q.spm) ? q.spm[0] : q.spm ?? '') || storedSpm || ''
  const id = inviterOf(sp); return id > 0 ? String(id) : ''
}
