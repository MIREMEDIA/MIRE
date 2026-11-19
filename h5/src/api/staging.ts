// Staging companion API (/h5api/): server-side first-recharge window, POST check-in, staging drama library.
// Enabled only when window.MIRE_CONFIG.companionApi is set; the library merge also needs stagingLibrary: true.
import { useUser } from '../stores/user'
import type { Resp } from './http'
const cfg = (window as any).MIRE_CONFIG || {}
export const COMPANION: string = String(cfg.companionApi || '').replace(/\/$/, '')
export const STAGING_LIB: boolean = !!cfg.stagingLibrary && !!COMPANION
export const isStagingId = (id: unknown) => /^s\d+$/.test(String(id))

async function creq<T = any>(r: string, opts: { method?: 'GET' | 'POST'; params?: Record<string, string>; headers?: Record<string, string> } = {}): Promise<Resp<T>> {
  const user = useUser()
  const q = new URLSearchParams({ r, ...(opts.params || {}) })
  try {
    const res = await fetch(`${COMPANION}/index.php?${q}`, { method: opts.method || 'GET', headers: { Token: user.token || '', ...(opts.headers || {}) } })
    const j = await res.json().catch(() => ({ code: 0, msg: res.statusText, data: null }))
    if (res.status === 401) user.needLogin = true
    return j
  } catch (e: any) { return { code: 0, msg: e?.message || 'network', data: null as any } }
}
const uuid = () => (crypto as any).randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`

export const libList = () => creq<any[]>('library.list')
export const libDetail = (id: string) => creq<any>('library.detail', { params: { id } })
export const frStatus = () => creq<{ started: boolean; start?: number; expire?: number; now: number; remaining?: number; eligible: boolean }>('fr.status')
export const frCheck = () => creq<{ eligible: boolean; remaining: number | null }>('fr.check')
export const checkinStatus = () => creq<{ today_done: boolean; streak: number; next_index: number | null; days: { day: number; score: number; is_sign: number }[] }>('checkin.status')
/** One key per tap: a retried/double-submitted request with the same key replays the first result instead of signing twice. */
export function checkinPost(key = uuid()) { return creq<{ coins: number; day: number; state: any }>('checkin', { method: 'POST', headers: { 'Idempotency-Key': key } }) }
