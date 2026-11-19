import { request, PRICE_LANG } from './http'
import { PENDING_LEGACY_KEY } from './b7Core'
import { PayError, payCall, redirectUrl } from '../payError'
/** Mirrors the live front end: {type}.create -> pay.paypal -> redirect. Called only on explicit user tap when signed in.
 *  B8: unpaid orders are listed by the server (order_list / vip_order/index ?include_unpaid=1); nothing is kept locally. */
export async function startPayment(o: { type: 'integral' | 'member'; pkgId: number; price: string; currency: string; payment: string; title?: string; videoId?: number; episodeId?: number; email?: string; phone?: string }) {
  if (!o.payment) throw new PayError('order')
  const ret = location.href
  const body: any = { total_fee: o.price, platform: 'H5', return_url: ret, pay_currency: o.currency, price: o.price, video_id: o.videoId || '', episode_id: o.episodeId || '', from: '', pay_email: o.email || '', pay_phone: o.phone || '' }
  if (o.type === 'integral') body.usable_id = o.pkgId; else body.vip_id = o.pkgId
  const c = await payCall(request, 'order', o.type === 'integral' ? '/usable/recharge' : '/vip_order/recharge', { method: 'POST', body, lang: PRICE_LANG })  // B16: failures -> PayError
  if (!c.data?.order_sn) throw new PayError('order', 1, '')
  return payOrder(c.data.order_sn, o.payment, o)
}
/** pay (or continue paying) an existing order */
export async function payOrder(order_sn: string, payment: string, o: { email?: string; phone?: string } = {}) {
  const ret = location.href; const sep = !ret.includes('?') ? '?' : /[?&]$/.test(ret) ? '' : '&' // B13: no stray '?&'
  const p = await payCall(request, 'pay', '/pay/paypal', { method: 'POST', lang: PRICE_LANG, body: { payment, pay_type: '', order_sn, platform: 'H5', return_url: ret + sep + 'buycs=1', cancel_url: ret, goods_url: ret, pay_email: o.email || '', pay_phone: o.phone || '' } })
  const url = redirectUrl(payment, p)
  if (!url) throw new PayError('redirect')  // B16: code 1 without a pay URL used to do nothing
  location.href = url
  return p
}
/** B8: drop the B7 local unpaid-order cache left in old browsers */
export const clearLegacyPending = () => { try { localStorage.removeItem(PENDING_LEGACY_KEY) } catch { /* ignore */ } }
