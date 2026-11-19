/**
 * FE-M3 Interactive games (影游 / IG) — Codex stable contract 2026-11-05
 *   GET  /addons/dramas/ig/index       ?page=&pagesize=  → data: GameRow[]
 *   GET  /addons/dramas/ig/detail?id=  → data + play_url + access
 *   POST /addons/dramas/ig_order/add   body ig_id[, platform=H5]
 *     → {order_id,total_fee,usable,replay}  (no play_url; refetch detail)
 * VIP free (vprice===0 + VIP): access.vip_free/can_play; do NOT call add.
 * request() prefixes API_BASE + '/addons/dramas'.
 *
 * Real vs mock:
 *   - Build with VITE_GAMES_API=1 → real (this fe_m3 package)
 *   - Runtime override: MIRE_CONFIG.gamesApi === false | '0' → force mock
 *                       MIRE_CONFIG.gamesApi === true | non-empty string → force real
 */
import { request, type Resp } from './http'

export type GameAccess = {
  unlocked: boolean
  vipFree: boolean
  canPlay: boolean
  needPay: boolean
  isLogin?: boolean
  isVip?: boolean
  vipExpiretime?: number
  payPrice?: number
  raw?: Record<string, any>
}

export type GameItem = {
  id: number
  title: string
  cover: string
  summary: string
  price: number
  vprice: number
  vipFree: boolean
  unlocked: boolean
  canPlay: boolean
  needPay: boolean
  tags?: string[]
  hot?: number
  views?: number
}

export type GameDetail = GameItem & {
  playUrl: string | null
  access: GameAccess
}

export type UnlockResult = {
  orderId: number
  totalFee: number
  usable: number
  replay: boolean
  /** filled after refetch detail */
  detail: GameDetail | null
}

const STUDIO_DEFAULT = 'https://staging.superchill.vip/studio/'

export function studioUrl(): string {
  const cfg = (typeof window !== 'undefined' && (window as any).MIRE_CONFIG) || {}
  return String(cfg.studioUrl || STUDIO_DEFAULT).replace(/\/*$/, '/') || STUDIO_DEFAULT
}

export function useGamesMock(): boolean {
  const cfg = (typeof window !== 'undefined' && (window as any).MIRE_CONFIG) || {}
  // Runtime override wins
  if (cfg.gamesApi === false || cfg.gamesApi === 0 || cfg.gamesApi === '0' || cfg.gamesApi === 'false') return true
  if (cfg.gamesApi === true || cfg.gamesApi === 1 || cfg.gamesApi === '1' || cfg.gamesApi === 'true') return false
  if (typeof cfg.gamesApi === 'string' && cfg.gamesApi.trim()) return false
  const env = String(import.meta.env.VITE_GAMES_API || '').trim().toLowerCase()
  if (env === '1' || env === 'true') return false
  if (env === '0' || env === 'false') return true
  return true // default mock when neither set
}

/** Mock playable HTML page as data URL (H5 iframe — never jump to Studio). */
export function mockPlayUrl(id: number | string, title: string): string {
  const html = `<!DOCTYPE html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">
<style>html,body{margin:0;height:100%;background:#101010;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;text-align:center}
.box{padding:24px}h1{font-size:18px;margin:0 0 8px}p{opacity:.7;font-size:13px;margin:0}</style></head>
<body><div class=box><h1>${escapeHtml(title)}</h1><p>影游试玩占位 · id=${escapeHtml(String(id))}<br>H5 内嵌播放（mock play_url）</p></div></body></html>`
  return 'data:text/html;charset=utf-8,' + encodeURIComponent(html)
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

function truthy(v: any): boolean {
  return v === true || v === 1 || v === '1' || v === 'true'
}

function svgCover(title: string, c1: string, c2: string) {
  return 'data:image/svg+xml,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="480"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="360" height="480" fill="url(#g)"/><text x="180" y="240" text-anchor="middle" fill="#fff" font-size="24" font-family="sans-serif">${title}</text></svg>`
  )
}

/** Map backend snake_case access → camelCase (keep is_login / is_vip / vip_expiretime / pay_price). */
export function mapAccess(raw: any, fallback?: Partial<GameAccess>): GameAccess {
  const a = raw && typeof raw === 'object' ? raw : {}
  const unlocked = truthy(a.unlocked ?? fallback?.unlocked)
  const vipFree = truthy(a.vip_free ?? a.vipFree ?? fallback?.vipFree)
  const canPlay = a.can_play != null || a.canPlay != null
    ? truthy(a.can_play ?? a.canPlay)
    : !!(fallback?.canPlay ?? unlocked)
  const needPay = a.need_pay != null || a.needPay != null
    ? truthy(a.need_pay ?? a.needPay)
    : !!(fallback?.needPay ?? (!canPlay && !unlocked))
  const out: GameAccess = { unlocked, vipFree, canPlay, needPay, raw: a }
  if (a.is_login != null || a.isLogin != null) out.isLogin = truthy(a.is_login ?? a.isLogin)
  else if (fallback?.isLogin != null) out.isLogin = fallback.isLogin
  if (a.is_vip != null || a.isVip != null) out.isVip = truthy(a.is_vip ?? a.isVip)
  else if (fallback?.isVip != null) out.isVip = fallback.isVip
  if (a.vip_expiretime != null || a.vipExpiretime != null) out.vipExpiretime = Number(a.vip_expiretime ?? a.vipExpiretime)
  else if (fallback?.vipExpiretime != null) out.vipExpiretime = fallback.vipExpiretime
  if (a.pay_price != null || a.payPrice != null) out.payPrice = Number(a.pay_price ?? a.payPrice)
  else if (fallback?.payPrice != null) out.payPrice = fallback.payPrice
  return out
}

/** Prefer image / description / views; mirror flat list flags onto item. */
export function mapGameItem(row: any): GameItem {
  const r = row || {}
  const price = Number(r.price ?? 0)
  const vprice = Number(r.vprice ?? 0)
  const unlocked = truthy(r.unlocked)
  const vipFree = truthy(r.vip_free ?? r.vipFree) || (price > 0 && vprice === 0)
  const canPlay = r.can_play != null || r.canPlay != null
    ? truthy(r.can_play ?? r.canPlay)
    : unlocked || price === 0
  const needPay = r.need_pay != null || r.needPay != null
    ? truthy(r.need_pay ?? r.needPay)
    : !canPlay
  return {
    id: Number(r.id),
    title: String(r.title || r.name || ''),
    cover: String(r.image || r.cover || r.poster || ''),
    summary: String(r.description || r.summary || r.desc || ''),
    price,
    vprice,
    vipFree,
    unlocked,
    canPlay,
    needPay,
    tags: Array.isArray(r.tags) ? r.tags.map(String) : undefined,
    views: r.views != null ? Number(r.views) : undefined,
    hot: r.views != null ? Number(r.views) : r.hots != null ? Number(r.hots) : r.hot != null ? Number(r.hot) : undefined,
  }
}

export function mapGameDetail(row: any): GameDetail {
  const item = mapGameItem(row)
  const playUrlRaw = row?.play_url ?? row?.playUrl ?? null
  const playUrl = playUrlRaw ? String(playUrlRaw) : null
  const access = mapAccess(row?.access, {
    unlocked: item.unlocked || item.price === 0,
    vipFree: item.vipFree,
    canPlay: item.canPlay || !!(playUrl || item.unlocked || item.price === 0),
    needPay: item.needPay,
    payPrice: item.price,
  })
  // Prefer server access mirrors on item
  if (row?.access) {
    item.vipFree = access.vipFree
    item.unlocked = access.unlocked
    item.canPlay = access.canPlay
    item.needPay = access.needPay
  }
  return { ...item, playUrl, access }
}

/** Seed-shaped mock rows (Codex seeds: QA Shadow Path free, QA Coin Gate 30). */
const MOCK_ROWS: any[] = [
  {
    id: 1, title: 'QA Shadow Path',
    image: svgCover('QA Shadow Path', '#102a1a', '#2fd27f'),
    description: 'IG MVP seed #1 — free (price=0).',
    price: 0, vprice: 0, status: 'normal', weigh: 100, views: 21000,
    unlocked: 1, vip_free: 0, can_play: 1, need_pay: 0,
  },
  {
    id: 2, title: 'QA Coin Gate',
    image: svgCover('QA Coin Gate', '#3a0a14', '#C8273C'),
    description: 'IG MVP seed #2 — priced; VIP free when vprice=0.',
    price: 30, vprice: 0, status: 'normal', weigh: 90, views: 50,
    unlocked: 0, vip_free: 0, can_play: 0, need_pay: 1,
  },
  {
    id: 3, title: '午夜抉择',
    image: svgCover('午夜抉择', '#3a0a14', '#8a2040'),
    description: '一通午夜来电，三个选项，三种结局。',
    price: 60, vprice: 0, status: 'normal', weigh: 80, views: 12800,
    unlocked: 0, vip_free: 0, can_play: 0, need_pay: 1,
  },
  {
    id: 4, title: '星际回信',
    image: svgCover('星际回信', '#0a1a3a', '#2c6bff'),
    description: '收到来自未来的邮件。回复什么，决定地球的命运。',
    price: 80, vprice: 0, status: 'normal', weigh: 70, views: 9600,
    unlocked: 0, vip_free: 0, can_play: 0, need_pay: 1,
  },
  {
    id: 5, title: '咖啡店恋爱线',
    image: svgCover('咖啡店恋爱线', '#3a2010', '#ff7a59'),
    description: '在街角咖啡店遇见 TA。对话分支决定你们是朋友还是恋人。',
    price: 40, vprice: 40, status: 'normal', weigh: 60, views: 15200,
    unlocked: 1, vip_free: 0, can_play: 1, need_pay: 0,
  },
]

/** Mock usable wallet (shared across unlock calls in this session). */
let mockUsable = 1280

function mockAccessFor(row: any, vipActive: boolean, isLogin = true): any {
  const price = Number(row.price ?? 0)
  const vprice = Number(row.vprice ?? 0)
  const unlocked = truthy(row.unlocked) || price === 0
  // VIP free when vprice===0 and price>0 and VIP active
  const vipFree = price > 0 && vprice === 0 && vipActive
  const canPlay = unlocked || vipFree
  const needPay = !canPlay
  return {
    is_login: isLogin ? 1 : 0,
    is_vip: vipActive ? 1 : 0,
    vip_expiretime: vipActive ? 1999999999 : 0,
    unlocked: unlocked ? 1 : 0,
    vip_free: vipFree ? 1 : 0,
    can_play: canPlay ? 1 : 0,
    need_pay: needPay ? 1 : 0,
    pay_price: price,
  }
}

function mockDetailPayload(row: any, vipActive = false, isLogin = true): any {
  const access = mockAccessFor(row, vipActive, isLogin)
  // list-style flat flags for consistency
  const flat = {
    unlocked: access.unlocked,
    vip_free: access.vip_free,
    can_play: access.can_play,
    need_pay: access.need_pay,
  }
  return {
    ...row,
    ...flat,
    play_url: access.can_play ? mockPlayUrl(row.id, row.title) : null,
    access,
  }
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)) }

/** GET /addons/dramas/ig/index — data is a flat array (no list wrapper). */
export async function listGames(opts?: { page?: number; pagesize?: number; search?: string }): Promise<Resp<{ list: GameItem[]; total: number }>> {
  const page = opts?.page ?? 1
  const pagesize = opts?.pagesize ?? 10
  if (useGamesMock()) {
    await delay(160)
    const start = (page - 1) * pagesize
    const slice = MOCK_ROWS.slice(start, start + pagesize)
    return { code: 1, msg: 'ok', data: { list: slice.map(mapGameItem), total: MOCK_ROWS.length } }
  }
  const r = await request<any>('/ig/index', { params: { page, pagesize, search: opts?.search } })
  if (r.code !== 1) return { code: r.code, msg: r.msg, data: { list: [], total: 0 } }
  // Contract: data is the array itself
  const listRaw = Array.isArray(r.data) ? r.data : (r.data?.list || [])
  const list = (Array.isArray(listRaw) ? listRaw : []).map(mapGameItem)
  return { code: 1, msg: r.msg || 'ok', data: { list, total: list.length } }
}

/** GET /addons/dramas/ig/detail?id= — includes access + play_url */
export async function getGame(id: number | string, opts?: { vipActive?: boolean }): Promise<Resp<GameDetail | null>> {
  if (useGamesMock()) {
    await delay(140)
    const row = MOCK_ROWS.find(x => x.id === Number(id))
    if (!row) return { code: 0, msg: 'not found', data: null }
    return { code: 1, msg: 'ok', data: mapGameDetail(mockDetailPayload(row, !!opts?.vipActive, true)) }
  }
  const r = await request<any>('/ig/detail', { params: { id } })
  if (r.code !== 1 || !r.data) return { code: r.code, msg: r.msg, data: null }
  return { code: 1, msg: r.msg || 'ok', data: mapGameDetail(r.data) }
}

/**
 * POST /addons/dramas/ig_order/add — body ig_id (+ optional platform=H5).
 * Response has NO play_url → refetch detail on success.
 * Do NOT call when VIP free (vprice===0 + VIP) / already can_play.
 */
export async function unlockGame(id: number | string, opts?: { vipActive?: boolean }): Promise<Resp<UnlockResult>> {
  const empty: UnlockResult = { orderId: 0, totalFee: 0, usable: 0, replay: false, detail: null }
  if (useGamesMock()) {
    await delay(200)
    const row = MOCK_ROWS.find(x => x.id === Number(id))
    if (!row) return { code: 0, msg: 'not found', data: empty }
    const price = Number(row.price ?? 0)
    const already = truthy(row.unlocked) || price === 0
    let totalFee = 0
    let replay = 0
    let orderId = 0
    if (already) {
      replay = 1
      totalFee = 0
    } else {
      if (mockUsable < price) return { code: 0, msg: '余额不足', data: { ...empty, usable: mockUsable } }
      mockUsable -= price
      totalFee = price
      orderId = Math.floor(Math.random() * 9000) + 1000
      row.unlocked = 1
      row.can_play = 1
      row.need_pay = 0
    }
    const detail = mapGameDetail(mockDetailPayload(row, !!opts?.vipActive, true))
    return {
      code: 1,
      msg: 'success',
      data: { orderId, totalFee, usable: mockUsable, replay: !!replay, detail },
    }
  }
  const r = await request<any>('/ig_order/add', { method: 'POST', body: { ig_id: id, platform: 'H5' } })
  if (r.code !== 1) return { code: r.code, msg: r.msg, data: empty }
  const usable = Number(r.data?.usable ?? 0)
  const orderId = Number(r.data?.order_id ?? 0)
  const totalFee = Number(r.data?.total_fee ?? 0)
  const replay = truthy(r.data?.replay)
  // Contract: no play_url on unlock → refetch detail
  const d = await getGame(id)
  return {
    code: 1,
    msg: r.msg || 'success',
    data: {
      orderId,
      totalFee,
      usable,
      replay,
      detail: d.code === 1 ? d.data : null,
    },
  }
}
