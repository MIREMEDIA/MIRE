/** B13: VIP status from FA /user/index. vip_expiretime is a unix timestamp in SECONDS (FA int column);
 *  values > 1e12 are treated as ms defensively. is_vip from the server is honoured, but expiry is re-checked
 *  against the device clock so a cached user.info flips to non-VIP once the time passes. */
export function vipState(info: any, now = Date.now()): { active: boolean; until: Date | null } {
  const raw = Number(info?.vip_expiretime || 0)
  if (!raw || !isFinite(raw)) return { active: false, until: null }
  const ms = raw > 1e12 ? raw : raw * 1000
  return { active: ms > now, until: new Date(ms) }
}
/** yyyy-mm-dd hh:mm in the viewer's local time zone */
export function fmtVipDate(d: Date | null): string {
  if (!d) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
