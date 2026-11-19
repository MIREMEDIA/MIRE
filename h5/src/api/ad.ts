// B7 #1/#3 watch-an-ad: /ad/index?type=unlock|usable -> play the ad for its duration -> /ad/add -> /ad/commit (FA Ad.php)
import { getAd, adAdd, adCommit } from './b7'
import { adPayload } from './rsa'
export const AD_KEY: string = String((window as any).MIRE_CONFIG?.adPublicKey || '')
export const adConfigured = () => !!AD_KEY
export interface AdInfo { id: number; title: string; image: string; video: string; link: string; seconds: number; usable: number }
export function normAd(d: any): AdInfo | null {
  const a = Array.isArray(d) ? d[0] : d; if (!a || !a.id) return null
  return { id: Number(a.id), title: String(a.title || a.name || ''), image: String(a.image || ''), video: String(a.video || a.url || a.video_url || ''), link: String(a.link || a.jump_url || ''),
    seconds: Math.max(3, Math.min(60, Number(a.duration ?? a.time ?? a.seconds ?? 15) || 15)), usable: Number(a.usable || 0) }
}
export async function loadAd(type: 'usable' | 'unlock', vid = 0, episode_id = 0) { const r = await getAd(type, vid, episode_id); return { r, ad: r.code === 1 ? normAd(r.data) : null } }
const now = () => Math.floor(Date.now() / 1000)
/** after the ad has been watched: add a log, then commit it (reward / unlock happens server-side) */
export async function finishAd(ad: AdInfo, type: 'usable' | 'unlock', vid = 0, episode_id = 0) {
  if (!AD_KEY) return { code: 0, msg: 'ad key not configured', data: null }
  const a = await adAdd(adPayload(AD_KEY, { ad_id: ad.id, time: now(), type, vid, episode_id, platform: 'H5' }))
  if (a.code !== 1 || !a.data?.id) return a
  return adCommit(adPayload(AD_KEY, { ad_log_id: a.data.id, time: now() }))
}
