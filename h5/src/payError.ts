// B16: every pay API failure (code != 1, HTTP error, network, no redirect URL) becomes a PayError with a readable message.
export type PayStage = 'order' | 'pay' | 'redirect' | 'network'
export class PayError extends Error {
  stage: PayStage; code: number | null; serverMsg: string; data: any
  constructor(stage: PayStage, code: number | null = null, serverMsg = '', data: any = null) { super(serverMsg || 'pay_' + stage); this.name = 'PayError'; this.stage = stage; this.code = code; this.serverMsg = serverMsg; this.data = data }
}
/** server msg made safe to show: string, tags stripped, trimmed, capped */
export function cleanMsg(r: any): string {
  const m = r && typeof r.msg === 'string' ? r.msg.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : ''
  return m.length > 300 ? m.slice(0, 300) + '…' : m
}
export const isPayOk = (r: any) => !!r && typeof r === 'object' && Number(r.code) === 1
export type T = (k: string, p?: Record<string, any>) => string
/** text for the toast: below-minimum (structured, localized) > server msg > generic per stage */
export function payErrorText(e: any, t: T): string {
  if (!e || e.name !== 'PayError') return t('b16.pay.failed')
  if (e.stage === 'network') return t('b16.pay.network')
  if (e.stage === 'redirect') return t('b16.pay.noRedirect')
  if (e.data && e.data.reason === 'below_min') return t('b16.pay.belowMin', { min: [e.data.currency, e.data.min].filter(Boolean).join(' ') })
  if (e.data && e.data.reason === 'm1pay_currency') return t('b16.pay.m1payCurrency', { cur: String(e.data.currency || '?') })  // B17
  return e.serverMsg || t('b16.pay.failed')
}
export type Req = (path: string, opts: any) => Promise<any>
/** wraps one API call: thrown fetch / bad JSON -> network; code != 1 -> PayError(stage) */
export async function payCall(req: Req, stage: 'order' | 'pay', path: string, opts: any) {
  let r: any
  try { r = await req(path, opts) } catch { throw new PayError('network') }
  if (!isPayOk(r)) throw new PayError(stage, r && r.code != null ? Number(r.code) : null, cleanMsg(r), r && r.data)
  return r
}
export function redirectUrl(payment: string, p: any): string {
  const d = (p && p.data && p.data.pay_data) || {}
  const u = payment === 'paypal' ? d.links?.[1]?.href : d.url || d.redirectUrl || d.params?.url
  return typeof u === 'string' && u ? u : ''
}
