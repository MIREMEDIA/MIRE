<template><div class="cm" :class="{ busy: loading }">
  <div class="pwh"><h3>{{ $t('cm.title') }}<small v-if="totalText">{{ totalText }}</small></h3><span class="x" @click="$emit('close')">✕</span></div>
  <div class="cmtabs"><span :class="{ on: sort === 'hot' }" @click="setSort('hot')">{{ $t('cm.hot') }}</span><span :class="{ on: sort === 'time' }" @click="setSort('time')">{{ $t('cm.new') }}</span></div>
  <div class="cmlist" ref="box" @scroll="onScroll">
    <div v-if="unsupported" class="cmempty">{{ $t('cm.unsupported') }}</div>
    <div v-else-if="err && !items.length" class="cmempty cmerr">{{ $t('cm.error') }}<button class="btn sm" @click="load(true)">{{ $t('common.retry') }}</button></div>
    <div v-else-if="!loading && !items.length" class="cmempty">{{ $t('cm.empty') }}</div>
    <div v-for="c in items" :key="c.id" class="cmi" :data-id="c.id">
      <img loading="lazy" decoding="async" class="cma" :src="c.user.avatar || fallbackAva" referrerpolicy="no-referrer" @error="onImg" />
      <div class="cmb">
        <div class="cmn">{{ c.user.nickname || $t('cm.anon') }}<em v-if="c.mine">{{ $t('cm.me') }}</em></div>
        <div class="cmc" dir="auto">{{ c.content }}</div>
        <div class="cmm"><span>{{ when(c.createtime) }}</span><span class="cmr" @click="startReply(c)">{{ $t('cm.reply') }}</span><span v-if="c.mine" class="cmd" @click="del(c)">{{ $t('cm.delete') }}</span></div>
        <div v-for="r in c.replies" :key="r.id" class="cmi sub" :data-id="r.id">
          <img loading="lazy" decoding="async" class="cma" :src="r.user.avatar || fallbackAva" referrerpolicy="no-referrer" @error="onImg" />
          <div class="cmb"><div class="cmn">{{ r.user.nickname || $t('cm.anon') }}<em v-if="r.mine">{{ $t('cm.me') }}</em></div>
            <div class="cmc" dir="auto">{{ r.content }}</div>
            <div class="cmm"><span>{{ when(r.createtime) }}</span><span class="cmr" @click="startReply(c, r)">{{ $t('cm.reply') }}</span><span v-if="r.mine" class="cmd" @click="del(r)">{{ $t('cm.delete') }}</span></div></div>
          <div class="cml" :class="{ on: r.liked }" @click="like(r)"><Icon name="heart" :size="16" fill /><span>{{ r.likesText }}</span></div>
        </div>
        <div v-if="c.replyCount > c.replies.length && !open[c.id]?.done" class="cmu" @click="more(c)">{{ open[c.id]?.loading ? '…' : $t('cm.unfold', { n: c.replyCount - c.replies.length }) }}</div>
        <div v-else-if="open[c.id]?.done && c.replies.length" class="cmu" @click="fold(c)">{{ $t('cm.packup') }}</div>
      </div>
      <div class="cml" :class="{ on: c.liked }" @click="like(c)"><Icon name="heart" :size="18" fill /><span>{{ c.likesText }}</span></div>
    </div>
    <div v-if="loading" class="cmempty">…</div>
  </div>
  <div class="cmin" v-if="!unsupported">
    <div v-if="replyTo" class="cmto">{{ $t('cm.replyTo', { n: replyTo.name }) }}<span @click="replyTo = null">✕</span></div>
    <div class="cmrow"><input ref="inp" v-model="text" dir="auto" :maxlength="MAX_LEN" :placeholder="user.token ? $t('cm.placeholder') : $t('cm.loginFirst')" @focus="needLoginGuard" @keyup.enter="send" />
      <button class="btn sm" :disabled="sending || !text.trim()" @click="send">{{ sending ? '…' : $t('cm.send') }}</button></div>
  </div>
</div></template>
<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Icon from './Icon.vue'
import { toast } from './toast'
import { useUser } from '../stores/user'
import { getComments, getCommentReplies, postComment, delComment, likeComment, dislikeComment, getUserInfo } from '../api'
import { isStagingId } from '../api/staging'
import { type CItem, type Sort, normPage, isOk, needsLogin, validateContent, toggleLike, applyLikes, respCount, localComment, normUser, relTime, mergeItems, removeItem, MAX_LEN } from '../api/commentsCore'
const props = defineProps<{ vid: number | string }>(); const emit = defineEmits(['close', 'count'])
const { t } = useI18n(); const user = useUser(); const router = useRouter()
const PS = 20; const RPS = 5
const items = ref<CItem[]>([]); const total = ref(-1); const totalText = ref(''); const page = ref(1); const hasMore = ref(false); const loading = ref(false); const err = ref(false)
const sort = ref<Sort>('hot'); const text = ref(''); const sending = ref(false); const replyTo = ref<{ pid: number; name: string } | null>(null)
const open = reactive<Record<number, { page: number; loading: boolean; done: boolean }>>({})
const unsupported = isStagingId(props.vid); const vid = Number(props.vid)
const box = ref<HTMLElement>(); const inp = ref<HTMLInputElement>()
const fallbackAva = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#3a3a44"/><circle cx="20" cy="15" r="7" fill="#777"/><path d="M6 38c2-9 26-9 28 0" fill="#777"/></svg>')
const onImg = (e: Event) => { const i = e.target as HTMLImageElement; if (i.src !== fallbackAva) i.src = fallbackAva }
const meId = () => Number(user.info?.id ?? user.info?.user_id ?? user.info?.userinfo?.id ?? 0)
function when(ts: number) { const r = relTime(ts); if (!r.key) return ''; return r.key === 'date' ? r.date! : t('cm.time.' + r.key, { n: r.n }) }
function goLogin() { user.needLogin = true; router.push('/login') }
function needLoginGuard() { if (!user.token) { inp.value?.blur(); toast(t('cm.loginFirst')); goLogin() } }
async function ensureMe() { if (user.token && !user.info) { try { const r = await getUserInfo(); if (isOk(r)) user.info = r.data } catch {} } }
// total: FA list has no total (#7) — only known from {comments} after post/delete
function setTotal(d: any) { const c = respCount(d, 'comments'); if (c) { total.value = c.n; totalText.value = c.text; emit('count', c.text) } }
async function load(reset = false) {
  if (unsupported || loading.value) return
  if (reset) { page.value = 1; items.value = []; hasMore.value = false }
  loading.value = true; err.value = false
  try {
    const r = await getComments(vid, page.value, PS, sort.value)
    if (!isOk(r)) { err.value = true; return }
    const pg = normPage(r.data, page.value, PS, meId(), { vid, pid: 0 })
    items.value = reset ? pg.items : mergeItems(items.value, pg.items); hasMore.value = pg.hasMore
  } catch { err.value = true } finally { loading.value = false }
}
function setSort(s: Sort) { if (sort.value !== s) { sort.value = s; load(true) } }
function onScroll() { const b = box.value; if (b && hasMore.value && !loading.value && b.scrollTop + b.clientHeight > b.scrollHeight - 80) { page.value++; load() } }
function patch(id: number, fn: (c: CItem) => CItem) { items.value = items.value.map(c => (c.id === id ? fn(c) : { ...c, replies: c.replies.map(r => (r.id === id ? fn(r) : r)) })) }
// #13 replies need login: guests are sent to login, a 401 mid-session too
async function more(c: CItem) {
  if (!user.token) { toast(t('cm.loginFirst')); return goLogin() }
  const o = (open[c.id] ||= { page: 0, loading: false, done: false }); if (o.loading) return; o.loading = true
  try {
    const r = await getCommentReplies(c.id, o.page + 1, RPS)
    if (needsLogin(r)) { toast(t('cm.loginFirst')); return goLogin() }
    if (!isOk(r)) { toast(r?.msg || t('cm.error')); return }
    const pg = normPage(r.data, o.page + 1, RPS, meId(), { vid, pid: c.id }); o.page++
    patch(c.id, x => ({ ...x, replies: mergeItems(x.replies.filter(y => y.id > 0), pg.items) }))
    if (!pg.hasMore) o.done = true
  } catch { toast(t('cm.error')) } finally { o.loading = false }
}
function fold(c: CItem) { delete open[c.id]; patch(c.id, x => ({ ...x, replies: [] })) }
function startReply(c: CItem, r?: CItem) { if (!user.token) return goLogin(); replyTo.value = { pid: c.id, name: (r || c).user.nickname || t('cm.anon') }; nextTick(() => inp.value?.focus()) }
async function send() {
  if (!user.token) return goLogin()
  const v = validateContent(text.value); if (v) { toast(t('cm.' + v)); return }
  sending.value = true
  try {
    const pid = replyTo.value?.pid || 0; const content = text.value.trim()
    const r = await postComment(vid, content, pid)
    if (needsLogin(r)) return goLogin()
    if (!isOk(r)) { toast(r?.msg || t('cm.error')); return }
    toast(t('cm.success')); setTotal(r.data)
    await ensureMe()
    text.value = ''; replyTo.value = null
    // #3 FA returns only {comments}: reload real rows; keep an optimistic local row if the reload does not show it yet
    const me = normUser({ ...(user.info || {}), user_id: meId() }); const tmp = localComment(vid, pid, content, me)
    if (pid) {
      patch(pid, x => ({ ...x, replyCount: x.replyCount + 1, replies: [] })); delete open[pid]
      const c = items.value.find(x => x.id === pid); if (c) await more(c)
      if (!items.value.find(x => x.id === pid)?.replies.some(y => y.mine && y.content === content)) patch(pid, x => ({ ...x, replies: [...x.replies, tmp] }))
    } else {
      sort.value = 'time'; await load(true)
      if (!items.value.some(x => x.mine && x.content === content)) items.value = [tmp, ...items.value]
    }
  } catch { toast(t('cm.error')) } finally { sending.value = false }
}
// #11 delete is shown for own rows only; a non-author delete is HTTP 500 on FA -> plain failure toast
async function del(c: CItem) {
  if (!c.mine || c.id < 0) return
  if (!confirm(t('cm.confirmDel'))) return
  try {
    const r = await delComment(c.id)
    if (needsLogin(r)) return goLogin()
    if (!isOk(r)) { toast(t('cm.error')); return }
    items.value = removeItem(items.value, c.id); setTotal(r.data)
    toast(t('cm.deleted'))
  } catch { toast(t('cm.error')) }
}
const liking = new Set<number>()
async function like(c: CItem) {
  if (!user.token) return goLogin()
  if (liking.has(c.id)) return; liking.add(c.id)
  if (c.id < 0) return
  const { method, next } = toggleLike(c); patch(c.id, () => next) // optimistic
  try {
    const r = await (method === 'like' ? likeComment(c.id) : dislikeComment(c.id)) // dislike = cancel like (cid)
    if (!isOk(r)) { patch(c.id, () => c); if (needsLogin(r)) goLogin(); else toast(r?.msg || t('cm.error')) }
    else patch(c.id, x => applyLikes(x, r.data)) // server count wins
  } catch { patch(c.id, () => c); toast(t('cm.error')) } finally { liking.delete(c.id) }
}
onMounted(async () => { await ensureMe(); load(true) })
</script>
