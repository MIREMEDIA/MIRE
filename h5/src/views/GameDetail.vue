<template>
  <section class="scr">
    <div class="top"><span class="ic2" @click="onBack"><Icon name="back" /></span><h1>{{ game?.title || $t('m3.games.title') }}</h1></div>
    <div class="body" style="padding:0 16px 40px" data-t="game-detail">
      <p v-if="err" class="oerr">{{ err }}<br /><button class="btn gob" @click="load">{{ $t('common.retry') }}</button></p>
      <p v-else-if="loading" class="note" style="text-align:center;padding:40px">{{ $t('common.loading') }}</p>
      <template v-else-if="game">
        <!-- H5 内嵌播放：play_url（iframe；勿跳 Studio） -->
        <div v-if="playing && playSrc" class="gdplayer" data-t="game-player">
          <iframe class="gdframe" :src="playSrc" title="ig-player" allow="autoplay; fullscreen" referrerpolicy="no-referrer"></iframe>
          <button class="btn ghost gdclose" data-t="game-player-close" @click="playing = false">{{ $t('common.back') }}</button>
        </div>
        <template v-else>
          <div class="gdhero">
            <img class="gdcover" :src="game.cover" alt="" />
            <div class="gdinfo">
              <b>{{ game.title }}</b>
              <div class="htags" style="margin-top:8px"><span v-for="tg in (game.tags || [])" :key="tg">{{ tg }}</span></div>
              <p class="sub" style="margin-top:10px">
                <template v-if="canPlay">✓ {{ accessLabel }}</template>
                <template v-else-if="game.price === 0">{{ $t('m3.games.free') }}</template>
                <template v-else>🪙 {{ payPrice }} · <span v-if="isVipFreeEligible">{{ $t('m3.games.vipFree') }}</span></template>
              </p>
            </div>
          </div>
          <p class="secT">{{ $t('m3.games.summary') }}</p>
          <p class="gdsum">{{ game.summary }}</p>
          <div class="gdbtns">
            <button v-if="canPlay" class="btn" data-t="game-play" @click="startPlay">{{ $t('m3.games.play') }}</button>
            <button v-else class="btn" data-t="game-unlock-open" @click="openUnlock">{{ $t('m3.games.unlock') }}</button>
          </div>
        </template>
      </template>
    </div>

    <Sheet v-model="unlockOpen">
      <div class="pwh"><h3>{{ $t('m3.games.unlockTitle') }}</h3><span class="x" @click="unlockOpen = false">✕</span></div>
      <div class="pwrow">
        <span>{{ $t('m3.games.price') }}: <b class="gold">🪙 {{ payPrice }}</b></span>
        <span class="sep"></span>
        <span>{{ $t('m3.games.balance') }}: <b>🪙 {{ balTxt }}</b></span>
      </div>
      <div class="unl3">
        <button class="btn" :disabled="busyU" data-t="game-unlock-coins" @click="unlockCoins"><span>🪙 {{ $t('m3.games.coins', { c: payPrice }) }}</span></button>
        <button v-if="isVipFreeEligible" class="btn ghost" data-t="game-unlock-vip" @click="goVip"><Icon name="crown" :size="16" /> {{ $t('m3.games.vipCta') }}</button>
      </div>
      <p class="secT" style="margin-top:14px">{{ $t('m3.games.topup') }}</p>
      <PayPanel v-if="unlockOpen" show-vip />
    </Sheet>
  </section>
</template>
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Icon from '../components/Icon.vue'
import Sheet from '../components/Sheet.vue'
import PayPanel from '../components/PayPanel.vue'
import { toast } from '../components/toast'
import { useUser } from '../stores/user'
import { getUserInfo } from '../api'
import { vipState } from '../vipState'
import { getGame, unlockGame, type GameDetail } from '../api/games'

const route = useRoute(); const router = useRouter(); const { t } = useI18n(); const user = useUser()
const game = ref<GameDetail | null>(null)
const loading = ref(true); const err = ref(''); const unlockOpen = ref(false); const busyU = ref(false); const balLoading = ref(false)
const playing = ref(false)

const vip = computed(() => vipState(user.token ? user.info : null))
/** vprice===0 + price>0 → VIP 免费候选（契约）；access.vip_free 真开后由服务端给出。 */
const isVipFreeEligible = computed(() => {
  const g = game.value; if (!g) return false
  if (g.access?.vipFree) return true
  if (g.vipFree) return true
  return g.price > 0 && g.vprice === 0
})
const payPrice = computed(() => {
  const g = game.value; if (!g) return 0
  if (g.access?.payPrice != null) return g.access.payPrice
  return g.price
})
/** Prefer server access.can_play; fall back for mock / VIP local. */
const canPlay = computed(() => {
  const g = game.value; if (!g) return false
  if (g.access?.canPlay) return true
  if (g.canPlay) return true
  if (g.playUrl) return true
  if (isVipFreeEligible.value && vip.value.active) return true
  if (g.access?.unlocked || g.unlocked || g.price === 0) return true
  return false
})
const needPay = computed(() => {
  const g = game.value; if (!g) return false
  if (g.access) return !!g.access.needPay
  if (g.needPay != null) return !!g.needPay
  return !canPlay.value
})
const accessLabel = computed(() => {
  const g = game.value; if (!g) return ''
  if (g.access?.unlocked || g.unlocked) return t('m3.games.unlocked')
  if ((g.access?.vipFree || isVipFreeEligible.value) && vip.value.active) return t('m3.games.vip')
  return t('m3.games.unlocked')
})
const playSrc = computed(() => {
  const g = game.value; if (!g) return ''
  return g.playUrl || ''
})
const balTxt = computed(() => user.info ? Number(user.info.usable ?? 0).toLocaleString() : (user.token ? '…' : '0'))

async function refreshMe() { const u = await getUserInfo(); if (u.code === 1) user.info = u.data }
watch(unlockOpen, v => { if (v && user.token && !user.info && !balLoading.value) { balLoading.value = true; refreshMe().catch(() => {}).finally(() => (balLoading.value = false)) } })

async function load() {
  loading.value = true; err.value = ''; game.value = null; playing.value = false
  try {
    const r = await getGame(String(route.params.id), { vipActive: vip.value.active })
    if (r.code === 1 && r.data) game.value = r.data
    else err.value = r.msg || t('m3.games.loadFail')
  } catch { err.value = t('m3.games.loadFail') }
  finally { loading.value = false }
}
onMounted(async () => { if (user.token) await refreshMe().catch(() => {}); await load() })
watch(() => route.params.id, () => load())
watch(() => vip.value.active, async (a, b) => { if (a !== b && game.value) await load() })

function onBack() {
  if (playing.value) { playing.value = false; return }
  router.back()
}
function startPlay() {
  if (!canPlay.value) { openUnlock(); return }
  playing.value = true
}
function openUnlock() {
  if (!user.token) { router.push({ path: '/login', query: { redirect: route.fullPath } }); return }
  // VIP 免费：不打开付费面板、不调 ig_order/add
  if (isVipFreeEligible.value && vip.value.active) { startPlay(); return }
  if (!needPay.value && canPlay.value) { startPlay(); return }
  unlockOpen.value = true
  refreshMe().catch(() => {})
}
function goVip() { unlockOpen.value = false; router.push('/vip') }

async function unlockCoins() {
  if (!user.token) { router.push({ path: '/login', query: { redirect: route.fullPath } }); return }
  if (!game.value || busyU.value) return
  // 硬闸：VIP 免费禁止调 order/add
  if (isVipFreeEligible.value && vip.value.active) {
    unlockOpen.value = false; startPlay(); return
  }
  busyU.value = true
  try {
    const r = await unlockGame(game.value.id, { vipActive: vip.value.active })
    if (r.code !== 1) { toast(r.msg || t('m3.games.unlockFail')); return }
    // 更新本地 usable（契约响应字段）
    if (user.info && r.data?.usable != null) {
      user.info = { ...user.info, usable: r.data.usable }
    } else {
      refreshMe().catch(() => {})
    }
    // 成功后再用 detail（unlock 响应无 play_url）
    if (r.data?.detail) {
      game.value = r.data.detail
    } else {
      const d = await getGame(game.value.id, { vipActive: vip.value.active })
      if (d.code === 1 && d.data) game.value = d.data
    }
    unlockOpen.value = false
    toast(r.msg || t('m3.games.unlockOk'))
    if (canPlay.value) playing.value = true
  } finally { busyU.value = false }
}
</script>
