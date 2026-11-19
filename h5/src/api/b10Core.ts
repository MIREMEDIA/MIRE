// B10 #6: watch-ad unlock follows play order. Episodes are in FA play order (weigh desc, id asc); a locked episode has no url
// (FA Video::detail sets url = null when checkEpisode() fails). Returns the earliest still-locked episode BEFORE `epId`.
export function firstLockedBefore(list: any[], epId: number): { index: number; ep: any } | null {
  const i = (list || []).findIndex(e => Number(e?.id) === Number(epId)); if (i <= 0) return null
  for (let k = 0; k < i; k++) { const e = list[k]; if (e && !e.url && Number(e.price || 0) > 0) return { index: k + 1, ep: e } }
  return null
}
// B10 二批#4: always the play position (names like "11" in a 6-episode drama are not what the user sees)
export const epLabel = (hit: { index: number; ep: any }) => String(hit.index || hit.ep?.name || '')
// B10 #7: body of /user_wallet_apply/apply — currency is required by FA (vs_lang currency, upper-case code)
export function wdApplyBody(type: string, money: number, currency: string): { type: string; money: number; currency: string; platform: 'H5' } | null {
  const c = String(currency || '').trim().toUpperCase(); const t = String(type || '').trim()
  if (!t || !c || !(Number(money) > 0)) return null
  return { type: t, money: Number(money), currency: c, platform: 'H5' }
}
// B10 二批#7: request id for /video/reward ([A-Za-z0-9_.-]{6,40}, FA VideoReward::add). Unique per tap.
export function tipReqId(rnd: () => number = Math.random, now: () => number = Date.now): string { return 't' + now().toString(36) + '-' + Math.floor(rnd() * 1e12).toString(36) }
