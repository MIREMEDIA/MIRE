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

/** Build-time real games API. Mock catalog is absent from this bundle. */
export const REAL_GAMES_BUILD = import.meta.env.VITE_GAMES_API === '1' || import.meta.env.VITE_GAMES_API === 'true'

export function useGamesMock(): boolean {
  if (REAL_GAMES_BUILD) return false
  const cfg = (typeof window !== 'undefined' && (window as any).MIRE_CONFIG) || {}
  // Runtime override wins on builds that still contain the local catalog.
  if (cfg.gamesApi === false || cfg.gamesApi === 0 || cfg.gamesApi === '0' || cfg.gamesApi === 'false') return true
  if (cfg.gamesApi === true || cfg.gamesApi === 1 || cfg.gamesApi === '1' || cfg.gamesApi === 'true') return false
  if (typeof cfg.gamesApi === 'string' && cfg.gamesApi.trim()) return false
  const env = String(import.meta.env.VITE_GAMES_API || '').trim().toLowerCase()
  if (env === '1' || env === 'true') return false
  if (env === '0' || env === 'false') return true
  return true // default mock when neither set
}

function truthy(v: any): boolean {
  return v === true || v === 1 || v === '1' || v === 'true'
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

/** GET /addons/dramas/ig/index — data is a flat array (no list wrapper). */
export async function listGames(opts?: { page?: number; pagesize?: number; search?: string }): Promise<Resp<{ list: GameItem[]; total: number }>> {
  const page = opts?.page ?? 1
  const pagesize = opts?.pagesize ?? 10
  if (import.meta.env.VITE_GAMES_API !== '1' && import.meta.env.VITE_GAMES_API !== 'true' && useGamesMock()) {
    const { mockListGames } = await import('./gamesMock')
    return mockListGames({ page, pagesize })
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
  if (import.meta.env.VITE_GAMES_API !== '1' && import.meta.env.VITE_GAMES_API !== 'true' && useGamesMock()) {
    const { mockGetGame } = await import('./gamesMock')
    return mockGetGame(id, opts)
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
  if (import.meta.env.VITE_GAMES_API !== '1' && import.meta.env.VITE_GAMES_API !== 'true' && useGamesMock()) {
    const { mockUnlockGame } = await import('./gamesMock')
    return mockUnlockGame(id, opts)
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
