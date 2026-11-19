// Row 22 comments — pure helpers (no Vue / no network) so they can be unit-tested with `node --test`.
// FA endpoints (base /addons/dramas/video/<method>): comment, delComment, likeComment, dislikeComment, commentsList (no login), commentReplysList (login).
// Shapes follow MireIT's staging FA source probe (b2b_deploy/COMMENTS_FOR_CODEX.md, VideoComments.php / Video.php line refs there).
export const COMMENT_PATHS = { list: '/video/commentsList', replies: '/video/commentReplysList', post: '/video/comment', del: '/video/delComment', like: '/video/likeComment', dislike: '/video/dislikeComment' } as const
export const MAX_LEN = 500 // #12 DB content varchar(512); FA has no validator and does not trim / reject empty
export interface CUser { id: number; nickname: string; avatar: string }
export interface CItem { id: number; pid: number; vid: number; userId: number; user: CUser; content: string; likes: number; likesText: string; liked: boolean; replyCount: number; replies: CItem[]; createtime: number; mine: boolean; replyTo: string }
export interface CPage { items: CItem[]; total: number; page: number; hasMore: boolean }
const num = (v: any, d = 0) => { const n = Number(v); return Number.isFinite(n) ? n : d }
/** #4 FA getLikesAttr / comments counter: >= 1000 becomes a string like "1.2K". Returns a number (1.2K -> 1200). */
export function parseCount(v: any): number {
  if (typeof v === 'number') return Number.isFinite(v) ? Math.max(0, v) : 0
  const m = /^\s*(-?\d+(?:\.\d+)?)\s*([kKmMwW]?)\s*$/.exec(String(v ?? ''))
  if (!m) return 0
  const mul = { k: 1e3, m: 1e6, w: 1e4 }[m[2].toLowerCase() as 'k' | 'm' | 'w'] || 1
  return Math.max(0, Math.round(Number(m[1]) * mul))
}
/** display: keep the server's "1.2K" string, else the number */
export const countText = (v: any): string => { const s = String(v ?? '').trim(); return /[kKmMwW]$/.test(s) ? s : String(parseCount(v)) }
const str = (v: any) => (v === null || v === undefined ? '' : String(v))
const truthy = (v: any) => v === true || v === 1 || v === '1' || v === 'true' || v === 'yes'
const pick = (o: any, keys: string[]) => { for (const k of keys) if (o && o[k] !== undefined && o[k] !== null && o[k] !== '') return o[k]; return undefined }
/** FA createtime is a unix timestamp (s); some list endpoints return a formatted string. Returns seconds (0 = unknown). */
export function toTs(v: any): number {
  if (v === undefined || v === null || v === '') return 0
  if (typeof v === 'number' || /^\d+$/.test(String(v))) { const n = Number(v); return n > 1e12 ? Math.floor(n / 1000) : n }
  const t = Date.parse(String(v).replace(' ', 'T')); return Number.isFinite(t) ? Math.floor(t / 1000) : 0
}
export function normUser(c: any): CUser {
  const u = (c && typeof c.user === 'object' && c.user) || (c && typeof c.userinfo === 'object' && c.userinfo) || {}
  return { id: num(pick(u, ['id', 'user_id']) ?? pick(c, ['user_id', 'uid'])), nickname: str(pick(u, ['nickname', 'username', 'name']) ?? pick(c, ['nickname', 'username', 'user_name'])), avatar: str(pick(u, ['avatar', 'head_img', 'image']) ?? pick(c, ['avatar', 'head_img'])) }
}
/** #8 rows carry no vid/pid: pass them from the call (vid of the drama; pid = 0 top level, parent id for replies). */
export function normComment(c: any, meId = 0, ctx: { vid?: number; pid?: number } = {}): CItem | null {
  if (!c || typeof c !== 'object') return null
  const id = num(pick(c, ['id', 'comment_id', 'cid'])); if (!id) return null
  const user = normUser(c)
  const kids = pick(c, ['replys', 'replies', 'children', 'reply_list', 'replys_list', 'child'])
  const replies = (Array.isArray(kids) ? kids : Array.isArray(kids?.data) ? kids.data : []).map((x: any) => normComment(x, meId, { vid: ctx.vid, pid: id })).filter(Boolean) as CItem[]
  const rc = pick(c, ['reply_count', 'replys_count']) // #9 FA: reply_count (counts hidden replies too)
    return { id, pid: num(ctx.pid ?? pick(c, ['pid'])), vid: num(ctx.vid ?? pick(c, ['vid'])), userId: user.id, user, content: str(c.content),
    likes: parseCount(c.likes), likesText: countText(c.likes), liked: truthy(c.is_like),
    replyCount: Math.max(parseCount(rc), replies.length), replies, createtime: toTs(c.createtime),
    // #10 FA returns no "mine" / "reply to" fields: mine = own user_id only; replyTo always ''
    mine: !!meId && user.id === meId, replyTo: '' }
}
/** #7 FA list data is a plain array (no total/last_page): hasMore = full page. total is unknown here (-1). */
export function normPage(data: any, page: number, pageSize: number, meId = 0, ctx: { vid?: number; pid?: number } = {}): CPage {
  const arr: any[] = Array.isArray(data) ? data : []
  const items = arr.map(x => normComment(x, meId, ctx)).filter(Boolean) as CItem[]
  return { items, total: -1, page, hasMore: items.length > 0 && items.length >= pageSize }
}
/** FA convention: code === 1 success. 401 (http or code) = login required. */
export const isOk = (r: any) => !!r && Number(r.code) === 1
export const needsLogin = (r: any) => !!r && Number(r.code) === 401
/** #11 non-author delete is a PHP Error -> HTTP 500 (non-JSON); http.ts turns it into {code: 500}: just a failure */
export const isServerError = (r: any) => !!r && Number(r.code) >= 500
export function validateContent(s: string): '' | 'empty' | 'long' { const t = (s || '').trim(); if (!t) return 'empty'; if ([...t].length > MAX_LEN) return 'long'; return '' }
export type Sort = 'hot' | 'time'
/** #1 FA reads only `sort` (hot | time); #14 replies: pid/page/pagesize (FA default 5). */
export const listParams = (vid: number, page: number, pageSize: number, sort: Sort) => ({ vid, page, pagesize: pageSize, sort: sort === 'hot' ? 'hot' : 'time' })
export const replyParams = (pid: number, page: number, pageSize = 5) => ({ pid, page, pagesize: pageSize })
/** #2 FA add() reads $params['image'] and ['pid'] directly: both keys must be present (may be empty / 0). */
export const postBody = (vid: number, content: string, pid = 0) => ({ vid, pid, content: content.trim(), image: '' })
/** #6 delComment reads `id`; likeComment / dislikeComment read `cid`. */
export const delBody = (id: number) => ({ id })
export const likeBody = (cid: number) => ({ cid })
/** #3 comment / delComment return {comments: <drama total>} (maybe "1.2K"); like/dislike return {likes}. */
export const respCount = (data: any, key: 'comments' | 'likes'): { n: number; text: string } | null =>
  data && typeof data === 'object' && data[key] !== undefined && data[key] !== null ? { n: parseCount(data[key]), text: countText(data[key]) } : null
/** #3 optimistic local row for a just-posted comment (server returns no row; id < 0 until the list is reloaded). */
let tmpId = 0
export function localComment(vid: number, pid: number, content: string, me: CUser, now = Math.floor(Date.now() / 1000)): CItem {
  return { id: --tmpId, pid, vid, userId: me.id, user: me, content: content.trim(), likes: 0, likesText: '0', liked: false, replyCount: 0, replies: [], createtime: now, mine: true, replyTo: '' }
}
/** Optimistic like toggle; returns the new state to send (like vs dislike = cancel like). */
/** #5 optimistic like toggle (dislike = cancel like). Display text follows the number unless the server sent "K". */
export function toggleLike(c: CItem): { method: 'like' | 'dislike'; next: CItem } {
  const on = !c.liked; const likes = Math.max(0, c.likes + (on ? 1 : -1))
  return { method: on ? 'like' : 'dislike', next: { ...c, liked: on, likes, likesText: /[kKmMwW]$/.test(c.likesText) ? c.likesText : String(likes) } }
}
/** #5 the server's {likes} wins after like/dislike */
export const applyLikes = (c: CItem, data: any): CItem => { const r = respCount(data, 'likes'); return r ? { ...c, likes: r.n, likesText: r.text } : c }
/** Relative time label key + params, mirrors FA lang keys time.now / time.minute / time.today / time.yesterday. */
export function relTime(ts: number, now = Math.floor(Date.now() / 1000)): { key: string; n?: number; date?: string } {
  if (!ts) return { key: '' }
  const d = Math.max(0, now - ts)
  if (d < 60) return { key: 'now' }
  if (d < 3600) return { key: 'minute', n: Math.floor(d / 60) }
  if (d < 86400) return { key: 'hour', n: Math.floor(d / 3600) }
  if (d < 2 * 86400) return { key: 'yesterday' }
  const dt = new Date(ts * 1000); const p = (x: number) => String(x).padStart(2, '0')
  return { key: 'date', date: `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}` }
}
/** Merge a page into the current list without duplicates (pages can shift when new comments are posted). */
export function mergeItems(cur: CItem[], add: CItem[]): CItem[] { const seen = new Set(cur.map(x => x.id)); return [...cur, ...add.filter(x => !seen.has(x.id))] }
export const removeItem = (list: CItem[], id: number): CItem[] => list.filter(x => x.id !== id).map(x => ({ ...x, replies: x.replies.filter(r => r.id !== id), replyCount: x.replies.some(r => r.id === id) ? Math.max(0, x.replyCount - 1) : x.replyCount }))
export const RTL_LANGS = ['ar', 'fa', 'he', 'ur']
export const dirOf = (code: string) => (RTL_LANGS.includes(String(code).split('-')[0].toLowerCase()) ? 'rtl' : 'ltr')
