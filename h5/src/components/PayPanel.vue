<template><div>
  <div v-if="first && left > 0" class="firstb" @click="pick('member', first)">
    <div class="fl"><span class="fbadge">{{ $t('unlock.firstTitle') }}</span><b>{{ $t('unlock.firstDesc', { plan: $t('vip.' + first.type), p: money(first.first_price, cur) }) }}</b>
      <p><s>{{ money(first.price, cur) }}</s> <em>{{ $t('wallet.off', { n: off(first.first_price, first.price) }) }}</em></p></div>
    <div class="fr"><small>{{ $t('wallet.endsIn') }}</small><div class="cdown"><i>{{ cd[0] }}</i>:<i>{{ cd[1] }}</i>:<i>{{ cd[2] }}</i></div></div>
  </div>
  <div class="packs2">
    <div v-for="p in coins" :key="p.id" class="pk2" :class="{ on: sel?.kind === 'integral' && sel.id === p.id }" @click="pick('integral', p)">
      <span class="rib2" v-if="p.id === best?.id">{{ $t('wallet.bestValue') }}</span><span class="rib2 hot" v-else-if="p.flag">{{ $st(p.flag) }}</span>
      <div class="cn"><span class="coin">🪙</span><b>{{ p.usable.toLocaleString() }}</b></div>
      <div class="bn2" v-if="p.give_usable">+{{ p.give_usable }} {{ $t('wallet.bonusCoins') }} <em>+{{ Math.round(p.give_usable / (p.usable - p.give_usable) * 100) }}%</em></div>
      <div class="prr"><span class="pr2">{{ money(p.price, cur) }}</span><s v-if="Number(p.original_price) > Number(p.price)">{{ money(p.original_price, cur) }}</s></div>
    </div>
  </div>
  <template v-if="showVip">
    <div v-for="v in vips" :key="v.id" class="vip2" :class="{ on: sel?.kind === 'member' && sel.id === v.id }" @click="pick('member', v)">
      <Icon name="crown" :size="22" fill /><div class="m"><b>{{ $t('vip.' + v.type) }} VIP</b><p>{{ $t('unlock.vipCta') }}</p></div>
      <div class="pr"><b>{{ money(effectivePrice(v, eligible), cur) }}</b><s v-if="isFirst(v, eligible)">{{ money(v.price, cur) }}</s><s v-else-if="Number(v.original_price) > Number(v.price)">{{ money(v.original_price, cur) }}</s></div>
    </div>
  </template>
  <p class="secT">{{ $t('wallet.method') }}</p>
  <p v-if="loaded && !methods.length" class="payempty">{{ $t('b7.pay.none') }}</p>
  <div class="pays2"><div v-for="m in methods" :key="m.type" class="pay2" :class="{ on: method === m.type }" @click="method = m.type"><img :src="m.logo" @error="($event.target as HTMLImageElement).style.display='none'" /><span>{{ m.name }}</span><i class="radio"></i></div></div>
  <button class="btn big" style="margin-top:16px" :disabled="!sel || !method || paying" data-t="panel-pay" @click="buy">{{ $t('unlock.pay', { p: sel ? money(payPrice(sel), cur) : '' }) }}</button>
  <p class="note">{{ $t('unlock.note') }} <router-link to="/orders" class="lnk">{{ $t('b7.orders.title') }} ›</router-link></p>
</div></template>
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCoinList, getVipList, getInit } from '../api'
import { COMPANION, frStatus, frCheck } from '../api/staging'
import { startPayment } from '../api/pay'
import { useUser } from '../stores/user'
import { payMethods, listCurrency } from '../api/b7Core'
import { money } from '../utils'
import { toast, toastPay } from './toast'
import { payErrorText } from '../payError'
import Icon from './Icon.vue'
import { useI18n } from 'vue-i18n'
import { firstEligible, isFirst, effectivePrice } from '../vipFirst'
const props = defineProps<{ showVip?: boolean; videoId?: number; episodeId?: number }>()
const { t } = useI18n(); const user = useUser(); const router = useRouter()
const coins = ref<any[]>([]); const vips = ref<any[]>([]); const methods = ref<any[]>([]); const method = ref(''); const cur = ref('USD'); const sel = ref<any>(null); const loaded = ref(false)
// First-purchase offer: price comes from the backend (vip.first_price). The live backend has no expiry field, so the
// countdown window is described at the startTs()/syncServer() block below.
// B15: only when the server says this user is eligible (/vip/index first_eligible) -> no first-price banner otherwise.
const eligible = ref(false)
const paying = ref(false)  // B16
const payPrice = (s: any) => (s.kind === 'member' ? effectivePrice(s, eligible.value) : s.price)
const first = computed(() => vips.value.filter(v => isFirst(v, eligible.value) && Number(v.first_price) < Number(v.price)).sort((a, b) => a.first_price - b.first_price)[0])
const best = computed(() => [...coins.value].sort((a, b) => b.usable / b.price - a.usable / a.price)[0])
const off = (a: any, b: any) => Math.round((1 - Number(a) / Number(b)) * 100)
const pick = (kind: string, p: any) => (sel.value = { kind, ...p })
const cd = ref(['00', '00', '00']); const left = ref(1); let tm: any
// First-recharge window = MIRE_CONFIG.firstRecharge.hours from its start.
// - Signed in + companion API (MIRE_CONFIG.companionApi): the start is recorded server-side per live user id
//   (/h5api fr.status) and re-checked (fr.check) before paying; clearing the browser does not reset it.
// - Otherwise (guests, or no companion API): display-only timer from the first visit in localStorage.
//   The real price is still decided by the backend at checkout.
const HRS = Number((window as any).MIRE_CONFIG?.firstRecharge?.hours ?? 24)
const srvStart = ref(0); const srvSkew = ref(0)
function startTs() {
  if (srvStart.value) return srvStart.value
  const k = 'mire_fr_start_guest'; let v = Number(localStorage.getItem(k))
  if (!v) { v = Date.now(); localStorage.setItem(k, String(v)) }
  return v
}
async function syncServer() {
  if (!COMPANION || !user.token) return
  const r = await frStatus(); if (r.code !== 1 || !r.data?.start) return
  srvSkew.value = r.data.now * 1000 - Date.now(); srvStart.value = r.data.start * 1000 - srvSkew.value; tick()
}
const tick = () => { const s = Math.max(0, Math.floor((startTs() + HRS * 3600e3 - Date.now()) / 1000)); left.value = s; cd.value = [s / 3600, (s % 3600) / 60, s % 60].map(x => String(Math.floor(x)).padStart(2, '0')); if (!s) clearInterval(tm) }
onMounted(async () => {
  tick(); tm = setInterval(tick, 1000); syncServer()
  const [c, v, i] = await Promise.all([getCoinList(), getVipList(), getInit()])
  coins.value = c.data?.list || []; eligible.value = firstEligible(v.data); vips.value = props.showVip ? (v.data?.list || []) : []; if (!props.showVip) vips.value = (v.data?.list || []).filter((x: any) => x.type === 'm')
  const lc = listCurrency(c.data) || listCurrency(v.data); if (lc) cur.value = lc  // B17: real package currency (was hardcoded USD)
  methods.value = payMethods(i.data, lc); method.value = methods.value[0]?.type || ''; loaded.value = true
  if (best.value) pick('integral', best.value)
})
onUnmounted(() => clearInterval(tm))
async function buy() {
  if (!sel.value || paying.value) return
  if (!method.value) { toast(t('b7.pay.none')); return }
  if (!user.token) { toast(t('unlock.loginFirst')); router.push('/login'); return }
  if (COMPANION && first.value && sel.value.kind === 'member' && sel.value.id === first.value.id) {
    const c = await frCheck(); if (c.code === 1 && !c.data?.eligible) { left.value = 0; toast(t('unlock.firstTitle') + ' ✕'); return }
  }
  const wasFirst = sel.value.kind === 'member' && isFirst(sel.value, eligible.value)
  paying.value = true
  try { await startPayment({ type: sel.value.kind, pkgId: sel.value.id, price: payPrice(sel.value), currency: cur.value, payment: method.value, title: sel.value.kind === 'member' ? 'VIP ' + t('vip.' + sel.value.type) : `${sel.value.usable} coins`, videoId: props.videoId, episodeId: props.episodeId }) }
  catch (e: any) {
    if (wasFirst) {  // B15/B16: re-read the server decision; "gone" only if it actually changed
      try { const v = await getVipList(); eligible.value = firstEligible(v.data); const l = v.data?.list || []
        vips.value = props.showVip ? l : l.filter((x: any) => x.type === 'm'); const s = vips.value.find(x => x.id === sel.value.id); if (s) pick('member', s) } catch { /* keep */ }
      if (!eligible.value) { toastPay(t('b15.first.gone')); return }
    }
    toastPay(payErrorText(e, t))
  } finally { paying.value = false }
}
</script>
