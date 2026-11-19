<template><section class="scr player" :class="{ lp: boost, shorts: isShorts }" @touchstart.passive="ts" @touchend="te" @wheel.passive="wh" @contextmenu="onCtx">
  <div v-for="(s, i) in slides" :key="s.ep.id" v-show="Math.abs(i - cur) <= 1" class="slide" :style="{ transform: `translateY(${(i - cur) * 100}%)` }">
    <img class="poster" :src="s.ep.image || s.drama.image" referrerpolicy="no-referrer" />
    <video v-if="Math.abs(i - cur) <= 1 && s.ep.url" :ref="el => setVid(i, el)" :poster="s.ep.image" playsinline webkit-playsinline x5-playsinline preload="metadata" @timeupdate="onTime(i, $event)" @ended="onEnded" @error="onErr(i)" @loadedmetadata="applyRate($event)" @play="applyRate($event)" @ratechange="onRate($event)" @click="vClick" @touchstart.passive="lpStart" @touchmove.passive="lpMove" @touchend="lpEnd" @touchcancel="lpEnd" @mousedown="lpStart" @mousemove="lpMove" @mouseup="lpEnd" @mouseleave="lpEnd" @contextmenu.prevent></video>
    <div v-if="!s.ep.url && i === cur" class="lockov"><div class="lockic"><Icon name="lock" :size="30" /></div><b>{{ $t('player.locked', { n: epPos(eps, s.ep) || s.ep.name }) }}</b><p class="sub">{{ $t('player.lockedDesc', { c: s.ep.price }) }}</p><button class="btn" style="width:200px" @click="unlockOpen = true">{{ $t('player.unlock') }}</button></div>
  </div>
  <div class="boostpill" v-if="boost">2x ▶▶</div>
  <div class="playbtn" v-if="paused && curSlide?.ep.url">▶</div>
  <div class="ptop"><span class="ic2" v-if="!isShorts" @click="$router.back()"><Icon name="back" /></span><img v-else class="logo" src="/mire_drama_logo_on_dark.png" /><div class="ttl">{{ isShorts ? '' : title }}</div><router-link v-if="isShorts" class="ic2" to="/search"><Icon name="search" /></router-link></div>
  <template v-if="curSlide">
    <div class="rail2">
      <div class="ava" @click="!isShorts ? (epOpen = true) : $router.push(`/play/${curSlide.drama.id}`)"><img :src="curSlide.drama.image" referrerpolicy="no-referrer" /><span class="plus" :class="{ ok: user.isFav(curSlide.drama.id) }" @click.stop="fav"><Icon :name="user.isFav(curSlide.drama.id) ? 'check' : 'plus'" :size="12" /></span></div>
      <div @click="liked = !liked" :class="{ red: liked }"><Icon name="heart" :size="32" fill />{{ curSlide.ep.likes || 0 }}</div>
      <div class="cmbtn" @click="cmOpen = true"><Icon name="chat" :size="30" fill />{{ cmCount === null ? $t('cm.title') : cmCount }}</div>
      <div @click="fav" :class="{ red: user.isFav(curSlide.drama.id) }"><Icon name="list" :size="30" fill />{{ $t('player.list') }}</div>
      <div @click="isShorts ? $router.push(`/play/${curSlide.drama.id}`) : (epOpen = true)"><Icon name="eps" :size="30" fill />{{ $t('player.episodes') }}</div>
      <div class="spdbtn" @click="spdOpen = true"><span class="spdv">{{ fmtRate(rate) }}</span>{{ $t('player.speed') }}</div>
      <div @click="share"><Icon name="share" :size="30" fill />{{ $t('common.share') }}</div>
      <div @click="openTip"><Icon name="gift" :size="30" />{{ $t('b7.tip.btn') }}</div>
    </div>
    <div class="pgrad"></div>
    <!-- the drama title is burned into the video, so Shorts shows only the EP/tag row (the player page keeps the title in the top bar) -->
    <div class="pinfo2">
      <p class="epl"><span class="epb">{{ slideTotal > 0 ? $t('player.desc', { a: epNo, b: slideTotal }) : $t('b7.epOnly', { a: epNo }) }}</span><span v-for="c in (curSlide.drama.category_text_arr || []).slice(0, 2)" :key="c" class="gt">{{ c }}</span></p>
      <p class="ds" v-if="curSlide.drama.description && curSlide.drama.description !== curSlide.drama.title">{{ curSlide.drama.description }}</p></div>
    <div class="prog2"><i :style="{ width: pct + '%' }"></i></div>
    <div class="eptrig2" :class="{ nonav: !isShorts }" @click="isShorts ? $router.push(`/play/${curSlide.drama.id}`) : (epOpen = true)"><Icon name="eps" :size="16" fill /><span>{{ eptrigText }}</span><Icon name="right" :size="16" /></div>
    <div class="autonext" v-if="nextIn > 0">{{ $t('player.autoNext', { n: nextIn }) }}</div>
  </template>
  <div v-else class="empty" style="margin-top:50%"><p>{{ err || $t('common.loading') }}</p><router-link v-if="err" to="/" class="lnk" style="display:inline-block;min-height:44px;line-height:44px">{{ $t('fem1.home') }} ›</router-link></div>
  <Sheet v-model="epOpen"><h3>{{ title }}</h3><p class="sub">{{ $t('player.total', { n: eps.length }) }}<template v-if="freeN > 0"> · {{ $t('player.freeUpTo', { n: freeN }) }}</template></p>
    <div class="segs"><span v-for="(g, gi) in groups" :key="gi" :class="{ on: seg === gi }" @click="seg = gi">{{ g[0] }}-{{ g[1] }}</span></div>
    <div class="eps"><div v-for="e in eps.slice(groups[seg]?.[0] - 1, groups[seg]?.[1])" :key="e.id" :class="{ c: curSlide?.ep.id === e.id, l: !e.url, w: watched(e) }" @click="jumpEp(e)">{{ epPos(eps, e) || e.name }}</div></div>
  </Sheet>
  <Sheet v-model="cmOpen"><Comments v-if="cmOpen && curSlide" :vid="curSlide.drama.id" @close="cmOpen = false" @count="n => (cmCount = n)" /></Sheet>
  <Sheet v-model="spdOpen"><div class="pwh"><h3>{{ $t('player.speedTitle') }}</h3><span class="x" @click="spdOpen = false">✕</span></div><p class="sub">{{ $t('player.speedHint') }}</p>
    <div class="spds"><div v-for="r in RATES" :key="r" :class="{ on: rate === r }" @click="setRate(r)">{{ fmtRate(r) }}<small v-if="r === 1">{{ $t('player.speedNormal') }}</small></div></div>
  </Sheet>
  <Sheet v-model="unlockOpen"><div class="pwh"><h3>{{ $t('unlock.title', { n: epNo }) }}</h3><span class="x" @click="unlockOpen = false">✕</span></div>
    <div class="pwrow"><span>{{ $t('unlock.price') }}: <b class="gold">🪙 {{ curSlide?.ep.price }}</b></span><span class="sep"></span><span>{{ $t('unlock.balance') }}: <b>🪙 {{ balTxt }}</b></span></div>
    <div class="autou"><span>{{ $t('unlock.autoUnlock') }}<small>{{ user.token ? '' : $t('unlock.autoHint') }}</small></span><i class="sw" :class="{ on: autoU }" @click="user.token ? (autoU = !autoU) : null"></i></div>
    <div class="unl3">
      <button class="btn" :disabled="busyU" @click="unlockCoins"><span>🪙 {{ $t('b7.unlock.coins', { c: curSlide?.ep.price }) }}</span></button>
      <button class="btn ghost" @click="goVip"><Icon name="crown" :size="16" /> {{ $t('b7.unlock.vip') }}</button>
      <button class="btn ghost" @click="unlockAd"><Icon name="play" :size="16" /> {{ $t('b7.unlock.ad') }}</button>
    </div>
    <p class="secT" style="margin-top:14px">{{ $t('unlock.topup') }}</p>
    <PayPanel v-if="unlockOpen" show-vip :video-id="curSlide?.drama.id" :episode-id="curSlide?.ep.id" />
  </Sheet>
  <Sheet v-model="tipOpen"><div class="pwh"><h3>{{ $t('b7.tip.title') }}</h3><span class="x" @click="tipOpen = false">✕</span></div>
    <p class="sub">{{ $t('unlock.balance') }}: 🪙 {{ balTxt }}</p>
    <div class="spds" data-b9="tip-presets"><div v-for="n in tipRule.presets" :key="n" :class="{ on: tipN === n }" @click="tipN = n">🪙 {{ n }}</div></div>
    <div class="field"><input v-model.number="tipN" type="number" :min="tipRule.min" :max="tipRule.max" inputmode="numeric" data-b9="tip-input" /></div>
    <p class="note" data-b9="tip-range">{{ $t('b9.tip.range', { min: tipRule.min, max: tipRule.max }) }}</p>
    <button class="btn" :disabled="busyT" @click="sendTip">{{ $t('b7.tip.send') }}</button>
  </Sheet>
  <ShareSheet ref="shareRef" /><AdSheet ref="adRef" @done="afterAd" />
</section></template>
<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, onBeforeRouteLeave } from 'vue-router'
import type Hls from 'hls.js'
import { errText } from '../i18n/fem1'
import { getDetail, getRecommend } from '../api'
import { STAGING_LIB, libList, libDetail } from '../api/staging'
import { useUser } from '../stores/user'
import { cleanTitle } from '../utils'
import Sheet from '../components/Sheet.vue'
import Comments from '../components/Comments.vue'
import PayPanel from '../components/PayPanel.vue'
import Icon from '../components/Icon.vue'
import ShareSheet from '../components/ShareSheet.vue'
import AdSheet from '../components/AdSheet.vue'
import { firstLockedBefore, epLabel } from '../api/b10Core'
import { getUserInfo, unlockEpisode } from '../api'
import { videoOrderAdd, shareVideo, tipVideo, getTipRule } from '../api/b7'
import { buildShareUrl, epTotal, epPos, freeUpTo, tipError, normTipRule, TIP_DEFAULT, type TipRule } from '../api/b7Core'
import { useRouter } from 'vue-router'
import { toast, clearToast } from '../components/toast'
import { useI18n } from 'vue-i18n'
const route = useRoute(); const user = useUser(); const { t } = useI18n()
const isShorts = computed(() => route.path === '/shorts')
const slides = ref<{ ep: any; drama: any }[]>([]); const eps = ref<any[]>([]); const drama = ref<any>(null); const cur = ref(0); const pct = ref(0); const paused = ref(false); const err = ref('')
const cmOpen = ref(false); const cmCount = ref<number | string | null>(null)
const liked = ref(false); const autoU = ref(false); const nextIn = ref(0); let nt: any
const epNo = computed(() => { const s = curSlide.value; if (!s) return ''; if (!isShorts.value) { const p = epPos(eps.value, s.ep); if (p > 0) return String(p) } const n = String(s.ep.name || ''); return n.replace(/\D+/g, '') || n })   // B10 二批#4: position, not the raw name
const epOpen = ref(false); const unlockOpen = ref(false); const seg = ref(0); let recPage = 1; let loadingMore = false
const vids: Record<number, HTMLVideoElement> = {}; const hlsMap: Record<number, Hls> = {}
const curSlide = computed(() => slides.value[cur.value])
const title = computed(() => cleanTitle(drama.value?.title || curSlide.value?.drama.title || ''))
// B7 #11: shorts slides only carry ep.video (no episodes_list) -> never print "0 episodes · Free up to EP 0"
const freeN = computed(() => freeUpTo(eps.value))
const slideTotal = computed(() => curSlide.value ? (isShorts.value ? epTotal(curSlide.value.drama) : epTotal(curSlide.value.drama, eps.value)) : 0)
const eptrigText = computed(() => { const n = slideTotal.value; const tot = n > 0 ? t('player.total', { n }) : ''
  if (isShorts.value) return [t('player.allEps'), tot].filter(Boolean).join(' · ')
  return [freeN.value > 0 ? t('player.freeUpTo', { n: freeN.value }) : '', tot].filter(Boolean).join(' · ') || t('player.allEps') })
const groups = computed(() => { const g: number[][] = []; for (let s = 1; s <= eps.value.length; s += 30) g.push([s, Math.min(s + 29, eps.value.length)]); return g })
const watched = (e: any) => { const h = user.history.find(x => x.id === drama.value?.id); return h && Number(e.name) < h.ep }
function setVid(i: number, el: any) { if (!el || vids[i] === el) return; vids[i] = el; const url = slides.value[i].ep.url as string
  // FE-M1 perf: hls.js (~400KB) is loaded only when an m3u8 needs it (mp4 / native HLS never download it)
  if (/\.m3u8/i.test(url) && !el.canPlayType('application/vnd.apple.mpegurl')) {
    import('hls.js').then(({ default: Hls }) => { if (vids[i] !== el) return
      if (!Hls.isSupported()) { el.src = url } else { const h = new Hls(); h.loadSource(url); h.attachMedia(el); h.on(Hls.Events.MANIFEST_PARSED, () => { el.playbackRate = effRate() }); hlsMap[i] = h }
      if (i === cur.value) nextTick(play) }).catch(() => { el.src = url; if (i === cur.value) nextTick(play) }); return }
  el.src = url
  if (i === cur.value) nextTick(play) }
function play() { if (!alive) return; const v = vids[cur.value]; Object.entries(vids).forEach(([k, x]) => { if (Number(k) !== cur.value) x.pause() }); if (!v) return; v.play().then(() => (paused.value = false)).catch(() => (paused.value = true)) }
const toggle = () => { const v = vids[cur.value]; if (!v) return; v.paused ? play() : (v.pause(), (paused.value = true)) }
const onTime = (i: number, e: Event) => { if (i !== cur.value) return; const v = e.target as HTMLVideoElement; pct.value = v.duration ? v.currentTime / v.duration * 100 : 0 }
// errors are only surfaced for the visible, current slide while this view is alive (autoplay/preload errors of
// off-screen slides, background tabs or a view that is being left are swallowed)
let alive = true; let errShown = false
const onErr = (i: number) => { if (!alive || i !== cur.value || document.hidden || errShown) return; errShown = true; toast(t('player.error')) }
function teardown() { alive = false; clearInterval(nt); lpEnd()
  Object.values(hlsMap).forEach(h => { try { h.destroy() } catch {} }); Object.keys(hlsMap).forEach(k => delete hlsMap[+k])
  Object.values(vids).forEach(v => { v.onerror = null; try { v.pause(); v.removeAttribute('src'); v.load() } catch {} }); Object.keys(vids).forEach(k => delete vids[+k])
  clearToast() }
function go(i: number) { lpEnd(); clearInterval(nt); nextIn.value = 0; if (i < 0 || i >= slides.value.length) return; cur.value = i; pct.value = 0; errShown = false }
const next = () => go(cur.value + 1)
function onEnded() { clearInterval(nt); nextIn.value = 3; nt = setInterval(() => { if (--nextIn.value <= 0) { clearInterval(nt); next() } }, 1000) }
let y0 = 0; const ts = (e: TouchEvent) => (y0 = e.touches[0].clientY)
const te = (e: TouchEvent) => { if (lpFired || boost.value) { y0 = e.changedTouches[0].clientY; return } if (spdOpen.value || epOpen.value || unlockOpen.value || tipOpen.value) return; const dy = e.changedTouches[0].clientY - y0; if (dy < -60) next(); else if (dy > 60) go(cur.value - 1) }
let wl = 0; const wh = (e: WheelEvent) => { if (epOpen.value || unlockOpen.value || Date.now() - wl < 600 || Math.abs(e.deltaY) < 30) return; wl = Date.now(); e.deltaY > 0 ? next() : go(cur.value - 1) }
// ---- playback speed ----
const RATES = [0.75, 1, 1.25, 1.5, 2]; const RK = 'mire_playback_rate'
const loadRate = () => { const r = Number(localStorage.getItem(RK)); return RATES.includes(r) ? r : 1 }
const rate = ref(loadRate()); const spdOpen = ref(false); const boost = ref(false)
const fmtRate = (r: number) => (Number.isInteger(r) ? r.toFixed(1) : String(r)) + 'x'
const effRate = () => (boost.value ? 2 : rate.value)
function applyRate(e?: Event) { const v = (e?.target as HTMLVideoElement) || vids[cur.value]; if (v && v.playbackRate !== effRate()) v.playbackRate = effRate() }
const onRate = (e: Event) => { const v = e.target as HTMLVideoElement; const want = effRate(); if (v.playbackRate !== want) setTimeout(() => { if (v.playbackRate !== effRate()) v.playbackRate = effRate() }, 0) }
function setRate(r: number) { rate.value = r; localStorage.setItem(RK, String(r)); Object.values(vids).forEach(v => (v.playbackRate = effRate())); spdOpen.value = false; toast(fmtRate(r)) }
// long-press = temporary 2x
let lpT: any = 0; let lpX = 0; let lpY = 0; let lpFired = false; let lpMouse = false
const pt = (e: any) => (e.touches ? e.touches[0] : e)
function lpStart(e: TouchEvent | MouseEvent) { if ((e as MouseEvent).button > 0) return; lpMouse = !(e as TouchEvent).touches; lpFired = false; const p = pt(e); lpX = p.clientX; lpY = p.clientY; clearTimeout(lpT)
  lpT = setTimeout(() => { const v = vids[cur.value]; if (!v || v.paused) return; lpFired = true; boost.value = true; v.playbackRate = 2; navigator.vibrate?.(15) }, 400) }
function lpMove(e: TouchEvent | MouseEvent) { if (!lpT || boost.value) return; if (!(e as TouchEvent).touches && !lpMouse) return; const p = pt(e); if (Math.abs(p.clientX - lpX) > 10 || Math.abs(p.clientY - lpY) > 10) { clearTimeout(lpT); lpT = 0 } }
function lpEnd() { clearTimeout(lpT); lpT = 0; lpMouse = false; if (boost.value) { boost.value = false; Object.values(vids).forEach(v => (v.playbackRate = rate.value)) } }
const vClick = () => { if (lpFired) { lpFired = false; return } toggle() }
const onCtx = (e: Event) => { if (boost.value || lpT || lpFired) e.preventDefault() }
const key = (e: KeyboardEvent) => { if (e.key === 'ArrowDown') next(); if (e.key === 'ArrowUp') go(cur.value - 1); if (e.key === ' ') toggle() }
function jumpEp(e: any) { const i = slides.value.findIndex(s => s.ep.id === e.id); epOpen.value = false; go(i) }
function fav() { const s = curSlide.value!; const d = s.drama; const on = user.toggleFav({ id: d.id, title: d.title, image: d.image, ep: Number(s.ep.name) || 1, episodes: d.episodes, episodeId: s.ep.id }); toast(t(on ? 'player.added' : 'player.removed')) }
// B7 #4: FA share link (spm/link_sign) + /video/share counter; ShareSheet handles navigator.share / copy / manual fallback
const router = useRouter(); const shareRef = ref<InstanceType<typeof ShareSheet>>(); const adRef = ref<InstanceType<typeof AdSheet>>()
// B9 #3: cold start (fresh tab / deep link) has a token but no user.info yet -> fetch it first so the link always carries spm
async function share() { const s = curSlide.value!; if (user.token && !(user.info?.id || user.info?.user_id)) { try { await refreshMe() } catch { /* share without spm */ } }
  const uid = user.info?.id || user.info?.user_id || ''
  const url = buildShareUrl(location, { uid, page: 'video', id: s.drama.id, linkSign: localStorage.getItem('mire_link_sign') || '' }) + `?ep=${encodeURIComponent(s.ep.name)}`
  const res = await shareRef.value?.share(url, cleanTitle(s.drama.title))
  if ((res === 'shared' || res === 'copied') && user.token) shareVideo(s.drama.id, s.ep.id).catch(() => {}) }
// B7 #1: unlock = coins (/video_order/add then reload URL) | VIP | ad (AdSheet type=unlock)
const busyU = ref(false)
async function reloadEp() { const s = curSlide.value!; const r = await unlockEpisode(s.drama.id, s.ep.id); if (r.code === 1 && r.data?.url) { s.ep.url = r.data.url; unlockOpen.value = false; await nextTick(); play() } return r }
async function unlockCoins() { if (!user.token) { router.push('/login'); return } const s = curSlide.value!; busyU.value = true
  try { const r = await videoOrderAdd(s.drama.id, s.ep.id); if (r.code !== 1) { toast(r.msg || t('b7.fail')); return } await reloadEp(); refreshMe(); toast(r.msg || t('b7.ok')) } finally { busyU.value = false } }
const goVip = () => { unlockOpen.value = false; router.push('/vip') }
// B10 #6: ad unlock follows play order — checked here before the ad starts (FA /ad/index + /ad/add enforce the same rule)
function unlockAd() { if (!user.token) { router.push('/login'); return } const s = curSlide.value!
  const hit = firstLockedBefore(eps.value.length ? eps.value : slides.value.map(x => x.ep), s.ep.id); if (hit) { toast(t('b10.ad.order', { n: epLabel(hit) })); return }
  adRef.value?.start('unlock', s.drama.id, s.ep.id) }
async function afterAd() { await reloadEp() }
// FE-M1 QA-R1-5：解锁面板打开时先加载余额；加载中显示占位「…」而不是 0
const balLoading = ref(false)
const balTxt = computed(() => user.info ? Number(user.info.usable ?? 0).toLocaleString() : (user.token ? '…' : '0'))
watch(unlockOpen, v => { if (v && user.token && !user.info && !balLoading.value) { balLoading.value = true; refreshMe().catch(() => {}).finally(() => (balLoading.value = false)) } })
async function refreshMe() { const u = await getUserInfo(); if (u.code === 1) user.info = u.data }
// B7 #8: tip (/video/reward video_id,num). B9 #1: tiers + min/max from FA /video/tipRule (admin "打赏配置"; backend enforces the same rule)
const tipOpen = ref(false); const tipRule = ref<TipRule>({ ...TIP_DEFAULT }); const tipN = ref(TIP_DEFAULT.presets[0]); const busyT = ref(false)
async function loadTipRule() { try { const r = await getTipRule(); if (r.code === 1) tipRule.value = normTipRule(r.data) } catch { /* keep default */ } if (!tipRule.value.presets.includes(tipN.value)) tipN.value = tipRule.value.presets[0] }
function openTip() { if (!user.token) { router.push('/login'); return } tipOpen.value = true; refreshMe(); loadTipRule() }
async function sendTip() { const e = tipError(Number(tipN.value), Number(user.info?.usable ?? 0), tipRule.value); if (e) { toast(e === 'min' || e === 'max' ? t('b9.tip.range', { min: tipRule.value.min, max: tipRule.value.max }) : t('b7.tip.' + e)); return }
  if (busyT.value) return   // B10 二批#7: one in-flight tip at a time
  busyT.value = true; let r: any; try { r = await tipVideo(curSlide.value!.drama.id, Number(tipN.value)) } catch { r = { code: 0 } } finally { busyT.value = false }
  toast(r.msg || (r.code === 1 ? t('b7.tip.thanks') : t('b7.fail'))); if (r.code === 1) { tipOpen.value = false; refreshMe() } }
watch(() => curSlide.value?.drama.id, () => { cmCount.value = null; cmOpen.value = false })
watch(cur, async (i) => {
  await nextTick(); applyRate(); play(); const s = slides.value[i]; if (!s) return
  if (!s.ep.url && !isShorts.value) unlockOpen.value = true
  if (!isShorts.value) user.pushHistory({ id: s.drama.id, title: s.drama.title, image: s.drama.image, ep: Number(s.ep.name) || i + 1, episodes: s.drama.episodes, episodeId: s.ep.id })
  if (isShorts.value && i >= slides.value.length - 3 && !loadingMore) loadRec()
  Object.keys(vids).forEach(k => { if (Math.abs(Number(k) - i) > 1) { hlsMap[+k]?.destroy(); delete hlsMap[+k]; delete vids[+k] } })
})
// shorts feed: with the staging library on, episode 1 of each staged drama is shown first
async function stagingFirstEps() { if (!STAGING_LIB) return []; const l = await libList(); const out: any[] = []
  for (const d of (l.data || []).slice(0, 5)) { const r = await libDetail(d.id); const e = r.data?.episodes_list?.[0]; if (e?.url) out.push({ ...e, video: r.data }) } return out }
async function loadRec() { loadingMore = true; const first = recPage === 1; const [r, st] = await Promise.all([getRecommend(recPage++), first ? stagingFirstEps() : Promise.resolve([])]); loadingMore = false
  if (st.length) r.data = [...st, ...(r.data || [])]
  const seen = new Set(slides.value.map(s => s.ep.id)); slides.value.push(...(r.data || []).filter((e: any) => e.url && !seen.has(e.id)).map((e: any) => ({ ep: e, drama: e.video }))) }
async function init() {
  slides.value = []; cur.value = 0; epOpen.value = false; unlockOpen.value = false; Object.keys(vids).forEach(k => delete vids[+k])
  if (isShorts.value) { await loadRec(); if (!slides.value.length) err.value = t('common.empty'); else play(); return }
  const r = await getDetail(route.params.id as string); if (r.code !== 1 || !r.data) { err.value = errText(r.msg, t('fem1.notFound')); return } // FE-M1 H-G2: no raw backend text
  drama.value = r.data; eps.value = r.data.episodes_list || []; slides.value = eps.value.map(e => ({ ep: e, drama: r.data }))
  const want = Number(route.query.ep) || user.history.find(h => h.id === r.data!.id)?.ep || 1
  let idx = eps.value.findIndex(e => Number(e.name) === want); if (idx < 0 && want >= 1 && want <= eps.value.length) idx = want - 1; idx = Math.max(0, idx); seg.value = Math.floor(idx / 30)   // B10 二批#4: names may not start at 1 — fall back to position
  if (idx === 0) { await nextTick(); play(); user.pushHistory({ id: r.data.id, title: r.data.title, image: r.data.image, ep: 1, episodes: r.data.episodes, episodeId: eps.value[0]?.id }) } else cur.value = idx
}
watch(() => route.fullPath, (p, o) => { if (route.path.startsWith('/play') || route.path === '/shorts') if (p.split('?')[0] !== o?.split('?')[0]) init() })
const onVis = () => { if (document.hidden) Object.values(vids).forEach(v => v.pause()) }
onMounted(() => { alive = true; init(); addEventListener('keydown', key); document.addEventListener('visibilitychange', onVis) })
onBeforeRouteLeave(() => { teardown() })
onBeforeUnmount(() => { removeEventListener('keydown', key); document.removeEventListener('visibilitychange', onVis); teardown() })
</script>
