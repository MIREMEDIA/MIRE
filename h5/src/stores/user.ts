import { defineStore } from 'pinia'
import { favAdd, favDel, logAdd, logList, favList } from '../api/b7'
import { mapLogRow, pageRows } from '../api/b7Core'
export interface HistItem { id: number; title: string; image: string; ep: number; episodes: number; t: number; episodeId?: number }
const ls = (k: string, d: any) => { try { return JSON.parse(localStorage.getItem(k) || '') ?? d } catch { return d } }
const save = (k: string, v: any) => localStorage.setItem(k, JSON.stringify(v))
// B7 #6: favourites/history are cached in localStorage (guests) and, when signed in, written to FA
// /video/favorite, /video/delLog(type=favorite), /video/log and read back from favoriteList / logList (syncServer after login).
const isServerId = (id: any) => /^\d+$/.test(String(id))
export const useUser = defineStore('user', {
  state: () => ({ token: localStorage.getItem('mire_token') || '', info: null as any, channel: '', needLogin: false, synced: false,
    history: ls('mire_history', []) as HistItem[], favorites: ls('mire_fav', []) as HistItem[], uiLang: localStorage.getItem('mire_ui_lang') || '' }),
  actions: {
    setToken(t: string) { this.token = t; localStorage.setItem('mire_token', t); this.synced = false; if (t) this.syncServer() },
    logout() { this.token = ''; this.info = null; this.synced = false; localStorage.removeItem('mire_token') },
    pushHistory(h: Omit<HistItem, 't'>, viewTime = 0) { this.history = [{ ...h, t: Date.now() }, ...this.history.filter(x => x.id !== h.id)].slice(0, 50); save('mire_history', this.history)
      if (this.token && isServerId(h.id) && h.episodeId) logAdd(h.id, h.episodeId, viewTime).catch(() => {}) },
    toggleFav(h: Omit<HistItem, 't'>) { const has = this.favorites.some(x => x.id === h.id); this.favorites = has ? this.favorites.filter(x => x.id !== h.id) : [{ ...h, t: Date.now() }, ...this.favorites]; save('mire_fav', this.favorites)
      if (this.token && isServerId(h.id)) (has ? favDel(h.id) : favAdd(h.id, h.episodeId || 0)).catch(() => {})
      return !has },
    isFav(id: number) { return this.favorites.some(x => x.id === id) },
    /** pull server lists, merge (server wins per id, newest first), and push local-only favourites once */
    async syncServer() {
      if (!this.token || this.synced) return; this.synced = true
      try {
        const [f, l] = await Promise.all([favList(), logList()])
        if (f.code === 1) { const srv = pageRows(f.data).map(mapLogRow).filter(x => x.id); const ids = new Set(srv.map(x => x.id))
          const localOnly = this.favorites.filter(x => !ids.has(x.id) && isServerId(x.id)); localOnly.forEach(x => favAdd(x.id, x.episodeId || 0).catch(() => {}))
          this.favorites = [...localOnly, ...srv.map(x => ({ ...x, t: x.t || Date.now() }))]; save('mire_fav', this.favorites) }
        if (l.code === 1) { const srv = pageRows(l.data).map(mapLogRow).filter(x => x.id); const m = new Map<number, HistItem>()
          for (const x of [...this.history, ...srv]) { const o = m.get(x.id); if (!o || (x.t || 0) > (o.t || 0)) m.set(x.id, { ...o, ...x }) }
          this.history = [...m.values()].sort((a, b) => (b.t || 0) - (a.t || 0)).slice(0, 50); save('mire_history', this.history) }
      } catch { this.synced = false }
    },
  },
})
