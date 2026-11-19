<template><section class="scr">
  <div class="body nopadtop" ref="bodyEl" @scroll="onScroll">
    <header class="hhead" :class="{ solid }"><img class="logo" src="/mire_drama_logo_on_dark.png" :alt="brand" /><div style="flex:1"></div>
      <router-link class="ic2" to="/search"><Icon name="search" /></router-link><router-link class="ic2" to="/language"><Icon name="globe" /></router-link></header>
    <div class="hero" v-if="heroes.length" @touchstart.passive="hs" @touchend="he">
      <div v-for="(d, i) in heroes" :key="d.id" class="hslide" :class="{ on: i === hi }"><img loading="lazy" decoding="async" :src="d.image" referrerpolicy="no-referrer" /></div>
      <div class="hcap"><h2>{{ cleanTitle(heroes[hi].title) }}</h2>
        <div class="htags"><span class="hot">{{ $t('b7.tag.hot') }}</span><span v-for="c in (heroes[hi].category_text_arr || []).slice(0, 2)" :key="c">{{ $st(c) }}</span><span v-if="Number(heroes[hi].episodes) > 0">{{ $t('common.eps', { n: heroes[hi].episodes }) }}</span></div>
        <div class="hbtns"><button class="playw" @click="$router.push(`/play/${heroes[hi].id}`)"><Icon name="play" :size="18" fill /> {{ $t('home.play') }}</button>
          <button class="addb" @click="fav(heroes[hi])"><Icon :name="user.isFav(heroes[hi].id) ? 'check' : 'plus'" :size="18" /> {{ $t('home.addList') }}</button></div>
        <div class="hdots"><i v-for="(d, i) in heroes" :key="i" :class="{ on: i === hi }" @click="hi = i"></i></div></div>
    </div>
    <div v-else-if="loading" class="hero skel"></div>
    <div class="chips2"><router-link v-for="c in cats" :key="c.id" :to="{ path: '/discover', query: { c: c.id } }">{{ $st(c.name) }}</router-link></div>
    <template v-if="user.history.length"><div class="sec2"><h2>{{ $t('home.continue') }}</h2><router-link to="/mylist?tab=history"><Icon name="right" :size="18" /></router-link></div>
      <div class="row2"><div class="cw2" v-for="h in user.history.slice(0, 10)" :key="h.id" @click="$router.push({ path: `/play/${h.id}`, query: { ep: h.ep } })"><div class="pi"><img loading="lazy" decoding="async" :src="h.image" referrerpolicy="no-referrer" /><span class="cwplay"><Icon name="play" :size="16" fill /></span><i class="bar" :style="{ width: (h.ep / h.episodes * 100) + '%' }"></i></div><div class="pt">{{ cleanTitle(h.title) }}</div><div class="pg">{{ $t('player.desc', { a: h.ep, b: h.episodes }) }}</div></div></div></template>
    <div class="sec2"><h2>🔥 {{ $t('home.top10') }}</h2><router-link :to="{ path: '/discover', query: { t: 'top' } }"><Icon name="right" :size="18" /></router-link></div>
    <div class="row2 top10"><Poster v-for="(d, i) in home.top.slice(0, 10)" :key="d.id" :d="d" :rank="i + 1" /></div>
    <div class="gamecard2" data-t="home-games" :data-games-entry="gamesEntry" @click="$router.push('/games')"><div><span class="newb">NEW</span><b>{{ $t('home.interactive') }}</b><p v-if="gamesEntry === 'live'">{{ $t('home.interactiveLive') }}</p><p v-else-if="gamesEntry === 'soon'">{{ $t('home.interactiveDesc') }}</p><p v-else>{{ $t('home.interactiveNeutral') }}</p></div><span class="gi">🎮</span></div>
    <div class="studiomini" data-t="home-studio" @click="$router.push('/studio')"><Icon name="tv" :size="18" /><span>{{ $t('m3.studio.homeCta') }}</span><Icon name="right" :size="14" /></div>
    <div class="sec2"><h2>{{ $t('home.must') }}</h2><router-link to="/discover"><Icon name="right" :size="18" /></router-link></div>
    <div class="row2"><template v-if="loading"><div class="pc" v-for="i in 3" :key="i"><div class="pi skel"></div></div></template><Poster v-for="d in home.must" :key="d.id" :d="d" tag="Hot" genre /></div>
    <NoticeBar />
    <div v-if="banners.length" class="sec2"><h2>{{ $t('home.featured') }}</h2></div>
    <div v-if="banners.length" class="row2 bnr"><div v-for="b in banners" :key="b.id" class="bcard" @click="$router.push(`/play/${b.video_id}`)"><img loading="lazy" decoding="async" :src="b.image" referrerpolicy="no-referrer" /><span>{{ b.title }}</span></div></div>
    <div class="sec2"><h2>{{ $t('home.trending') }}</h2></div>
    <div class="seg2"><span :class="{ on: rk === 'top' }" @click="rk = 'top'">{{ $t('home.popular') }}</span><span :class="{ on: rk === 'news' }" @click="rk = 'news'">{{ $t('home.newTab') }}</span></div>
    <div v-for="(d, i) in (rk === 'top' ? home.top : home.news).slice(0, 8)" :key="d.id" class="rank2" @click="$router.push(`/play/${d.id}`)">
      <div class="pi"><img :src="d.image" loading="lazy" referrerpolicy="no-referrer" /><b class="rk sm" :class="'r' + (i + 1)">{{ i + 1 }}</b></div>
      <div class="m"><b>{{ cleanTitle(d.title) }}</b><div class="tg"><span v-for="c in (d.category_text_arr || []).slice(0, 3)" :key="c">{{ $st(c) }}</span></div><p><Icon name="fire" :size="13" fill /> {{ compact(d.hots) }} · {{ $t('common.eps', { n: d.episodes }) }}</p></div>
      <span class="mplay"><Icon name="play" :size="16" fill /></span></div>
    <div class="sec2"><h2>{{ $t('home.news') }}</h2></div><div class="grid2"><Poster v-for="d in home.news" :key="d.id" :d="d" tag="New" /></div>
    <p class="note" style="text-align:center;padding:24px"><router-link to="/doc/terms">{{ $t('me.terms') }}</router-link> · <router-link to="/doc/privacy">{{ $t('me.privacy') }}</router-link> · © {{ brand }}</p>
  </div></section></template>
<script setup lang="ts">
import { brand } from '../brand'
import { ref, reactive, computed, onMounted, onUnmounted , watch } from 'vue'
import { getHome, getBanners, getCategories } from '../api'
import { listGames } from '../api/games'
import { gamesEntryState, type GamesEntry } from '../gamesEntry'
import { STAGING_LIB, libList } from '../api/staging'
import Poster from '../components/Poster.vue'
import NoticeBar from '../components/NoticeBar.vue'
import Icon from '../components/Icon.vue'
import { useUser } from '../stores/user'
import { compact, cleanTitle } from '../utils'
import { toast } from '../components/toast'
import { useI18n } from 'vue-i18n'
defineOptions({ name: 'Home' })
const user = useUser(); const { t } = useI18n()
const home = reactive({ must: [] as any[], news: [] as any[], top: [] as any[] }); const banners = ref<any[]>([]); const cats = ref<any[]>([]); const hi = ref(0); const loading = ref(true); const rk = ref('top'); const solid = ref(false)
const gamesEntry = ref<GamesEntry>('unknown')
// B7 #10: hero = top/must; when those are empty (e.g. a content language with no ranked titles) fall back to /block/index
// banners, and once loading is over with nothing to show the hero is hidden instead of leaving a blank skeleton
const heroes = computed(() => { const a = [...(home.top || []).slice(0, 3), ...(home.must || []).slice(0, 2)].filter((d, i, a) => d?.image && a.findIndex(x => x.id === d.id) === i)
  return a.length ? a : banners.value.filter(b => b.image && b.video_id).slice(0, 5).map(b => ({ id: b.video_id, title: b.title || b.name || '', image: b.image, episodes: b.episodes || 0, category_text_arr: [] })) })
const onScroll = (e: Event) => (solid.value = (e.target as HTMLElement).scrollTop > 300)
let x0 = 0; const hs = (e: TouchEvent) => (x0 = e.touches[0].clientX)
const he = (e: TouchEvent) => { const dx = e.changedTouches[0].clientX - x0; const n = heroes.value.length; if (Math.abs(dx) > 40) hi.value = (hi.value + (dx < 0 ? 1 : n - 1)) % n }
const fav = (d: any) => toast(t(user.toggleFav({ id: d.id, title: d.title, image: d.image, ep: 1, episodes: d.episodes }) ? 'player.added' : 'player.removed'))
watch(() => heroes.value.length, n => { if (hi.value >= n) hi.value = 0 })
let timer: any
onMounted(async () => {
  listGames({ page: 1, pagesize: 20 }).then(r => {
    if (r.code !== 1) { gamesEntry.value = 'unknown'; return }
    gamesEntry.value = gamesEntryState(Math.max(r.data?.list?.length ?? 0, Number(r.data?.total) || 0))
  }).catch(() => { gamesEntry.value = 'unknown' })
  const [h, b, c, s] = await Promise.all([getHome(), getBanners(), getCategories(), STAGING_LIB ? libList() : Promise.resolve({ data: [] } as any)])
  Object.assign(home, h.data || {}); banners.value = b.data || []; cats.value = c.data?.[0]?.children || []; loading.value = false
  // staging library (MIRE_CONFIG.stagingLibrary): newly published works lead "Must watch" and "New releases"
  const st: any[] = Array.isArray(s.data) ? s.data : []
  if (st.length) { home.must = [...st, ...(home.must || [])]; home.news = [...st, ...(home.news || [])] }
  timer = setInterval(() => heroes.value.length && (hi.value = (hi.value + 1) % heroes.value.length), 5000)
})
onUnmounted(() => clearInterval(timer))
</script>
