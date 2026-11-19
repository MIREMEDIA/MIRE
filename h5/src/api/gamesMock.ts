/**
 * In-repo games catalog used only when the build is not VITE_GAMES_API=1|true.
 * The real-API static package does not import this module.
 */
import { mapGameDetail, mapGameItem, type UnlockResult } from './games'
import type { Resp } from './http'

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

function truthy(v: any): boolean {
  return v === true || v === 1 || v === '1' || v === 'true'
}

export function mockPlayUrl(id: number | string, title: string): string {
  const html = `<!DOCTYPE html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">
<style>html,body{margin:0;height:100%;background:#101010;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;text-align:center}
.box{padding:24px}h1{font-size:18px;margin:0 0 8px}p{opacity:.7;font-size:13px;margin:0}</style></head>
<body><div class=box><h1>${escapeHtml(title)}</h1><p>local placeholder · id=${escapeHtml(String(id))}</p></div></body></html>`
  return 'data:text/html;charset=utf-8,' + encodeURIComponent(html)
}

function svgCover(title: string, c1: string, c2: string) {
  return 'data:image/svg+xml,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="480"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="360" height="480" fill="url(#g)"/><text x="180" y="240" text-anchor="middle" fill="#fff" font-size="24" font-family="sans-serif">${title}</text></svg>`
  )
}

const MOCK_ROWS: any[] = [
  { id: 1, title: 'QA Shadow Path', image: svgCover('QA Shadow Path', '#102a1a', '#2fd27f'), description: 'IG MVP seed #1 — free (price=0).', price: 0, vprice: 0, status: 'normal', weigh: 100, views: 21000, unlocked: 1, vip_free: 0, can_play: 1, need_pay: 0 },
  { id: 2, title: 'QA Coin Gate', image: svgCover('QA Coin Gate', '#3a0a14', '#C8273C'), description: 'IG MVP seed #2 — priced; VIP free when vprice=0.', price: 30, vprice: 0, status: 'normal', weigh: 90, views: 50, unlocked: 0, vip_free: 0, can_play: 0, need_pay: 1 },
  { id: 3, title: '午夜抉择', image: svgCover('午夜抉择', '#3a0a14', '#8a2040'), description: '一通午夜来电，三个选项，三种结局。', price: 60, vprice: 0, status: 'normal', weigh: 80, views: 12800, unlocked: 0, vip_free: 0, can_play: 0, need_pay: 1 },
  { id: 4, title: '星际回信', image: svgCover('星际回信', '#0a1a3a', '#2c6bff'), description: '收到来自未来的邮件。回复什么，决定地球的命运。', price: 80, vprice: 0, status: 'normal', weigh: 70, views: 9600, unlocked: 0, vip_free: 0, can_play: 0, need_pay: 1 },
  { id: 5, title: '咖啡店恋爱线', image: svgCover('咖啡店恋爱线', '#3a2010', '#ff7a59'), description: '在街角咖啡店遇见 TA。对话分支决定你们是朋友还是恋人。', price: 40, vprice: 40, status: 'normal', weigh: 60, views: 15200, unlocked: 1, vip_free: 0, can_play: 1, need_pay: 0 },
]

let mockUsable = 1280
const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

function mockAccessFor(row: any, vipActive: boolean, isLogin = true): any {
  const price = Number(row.price ?? 0)
  const vprice = Number(row.vprice ?? 0)
  const unlocked = truthy(row.unlocked) || price === 0
  const vipFree = price > 0 && vprice === 0 && vipActive
  const canPlay = unlocked || vipFree
  const needPay = !canPlay
  return { is_login: isLogin ? 1 : 0, is_vip: vipActive ? 1 : 0, vip_expiretime: vipActive ? 1999999999 : 0, unlocked: unlocked ? 1 : 0, vip_free: vipFree ? 1 : 0, can_play: canPlay ? 1 : 0, need_pay: needPay ? 1 : 0, pay_price: price }
}

function mockDetailPayload(row: any, vipActive = false, isLogin = true): any {
  const access = mockAccessFor(row, vipActive, isLogin)
  return { ...row, unlocked: access.unlocked, vip_free: access.vip_free, can_play: access.can_play, need_pay: access.need_pay, play_url: access.can_play ? mockPlayUrl(row.id, row.title) : null, access }
}

export async function mockListGames(opts?: { page?: number; pagesize?: number }): Promise<Resp<{ list: ReturnType<typeof mapGameItem>[]; total: number }>> {
  const page = opts?.page ?? 1
  const pagesize = opts?.pagesize ?? 10
  await delay(160)
  const start = (page - 1) * pagesize
  const slice = MOCK_ROWS.slice(start, start + pagesize)
  return { code: 1, msg: 'ok', data: { list: slice.map(mapGameItem), total: MOCK_ROWS.length } }
}

export async function mockGetGame(id: number | string, opts?: { vipActive?: boolean }): Promise<Resp<ReturnType<typeof mapGameDetail> | null>> {
  await delay(140)
  const row = MOCK_ROWS.find(x => x.id === Number(id))
  if (!row) return { code: 0, msg: 'not found', data: null }
  return { code: 1, msg: 'ok', data: mapGameDetail(mockDetailPayload(row, !!opts?.vipActive, true)) }
}

export async function mockUnlockGame(id: number | string, opts?: { vipActive?: boolean }): Promise<Resp<UnlockResult>> {
  const empty: UnlockResult = { orderId: 0, totalFee: 0, usable: 0, replay: false, detail: null }
  await delay(200)
  const row = MOCK_ROWS.find(x => x.id === Number(id))
  if (!row) return { code: 0, msg: 'not found', data: empty }
  const price = Number(row.price ?? 0)
  const already = truthy(row.unlocked) || price === 0
  let totalFee = 0
  let replay = 0
  let orderId = 0
  if (already) replay = 1
  else {
    if (mockUsable < price) return { code: 0, msg: '余额不足', data: { ...empty, usable: mockUsable } }
    mockUsable -= price
    totalFee = price
    orderId = Math.floor(Math.random() * 9000) + 1000
    row.unlocked = 1
    row.can_play = 1
    row.need_pay = 0
  }
  return { code: 1, msg: 'success', data: { orderId, totalFee, usable: mockUsable, replay: !!replay, detail: mapGameDetail(mockDetailPayload(row, !!opts?.vipActive, true)) } }
}
