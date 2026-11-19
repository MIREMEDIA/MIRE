<template><section class="scr">
  <div class="top"><span class="ic2" @click="$router.back()"><Icon name="back" /></span><h1>{{ $t('vip.title') }}</h1></div>
  <div class="body" style="padding:0 16px 40px">
    <div class="ck" style="background:linear-gradient(140deg,#4a3410,#1d160b);text-align:center"><div style="font-size:40px">👑</div><b style="font-size:20px;color:var(--gold)">{{ $t('vip.hero') }}</b>
      <p v-if="vip.active" class="sub" data-t="vip-status" style="margin-top:8px;color:var(--gold)">{{ $t('b13.vip.active') }} · {{ $t('b13.vip.until', { d: fmtVipDate(vip.until) }) }}</p>
      <p class="sub" style="margin-top:8px">✓ {{ $t('vip.b1') }} · ✓ {{ $t('vip.b2') }} · ✓ {{ $t('vip.b3') }}</p></div>
    <div v-for="v in vips" :key="v.id" class="vipc" :class="{ on: sel?.id === v.id }" @click="sel = v"><div class="m"><b>{{ $t('vip.' + v.type) }}</b><span class="mini" data-t="first-badge" v-if="isFirst(v, eligible)">{{ $t('b15.first.badge') }}</span><p>{{ $st(v.desc) }}</p></div><div class="pr" data-t="vip-price">{{ money(effectivePrice(v, eligible), cur) }}<s v-if="isFirst(v, eligible)">{{ money(v.price, cur) }}</s><s v-else>{{ money(v.original_price, cur) }}</s></div></div>
    <p class="secT">{{ $t('wallet.method') }}</p>
    <p v-if="loaded && !methods.length" class="payempty">{{ $t('b7.pay.none') }}</p>
    <div v-for="m in methods" :key="m.type" class="pay" :class="{ on: method === m.type }" @click="method = m.type"><img :src="m.logo" @error="($event.target as HTMLImageElement).style.display='none'" /><span>{{ m.name }}</span>{{ method === m.type ? '●' : '○' }}</div>
    <button class="btn gold" style="margin-top:14px" :disabled="!sel || !method || paying" data-t="vip-pay" @click="buy">{{ $t('vip.cont', { p: sel ? money(effectivePrice(sel, eligible), cur) : '' }) }}</button>
    <p class="note">{{ $t('vip.renew') }} {{ $t('unlock.note') }} <router-link to="/orders" class="lnk">{{ $t('b7.orders.title') }} ›</router-link></p>
  </div></section></template>
<script setup lang="ts">
import Icon from '../components/Icon.vue'
import { ref, onMounted, computed } from 'vue'
import { getUserInfo } from '../api'
import { vipState, fmtVipDate } from '../vipState'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getVipList, getInit } from '../api'
import { startPayment } from '../api/pay'
import { useUser } from '../stores/user'
import { money } from '../utils'
import { toast, toastPay } from '../components/toast'
import { payErrorText } from '../payError'
import { payMethods, listCurrency } from '../api/b7Core'
import { firstEligible, isFirst, effectivePrice } from '../vipFirst'
const eligible = ref(false) // B15: server decision only
const paying = ref(false)  // B16: button disabled while a pay call runs, re-enabled on any failure
const vips = ref<any[]>([]); const sel = ref<any>(null); const methods = ref<any[]>([]); const method = ref(''); const loaded = ref(false); const cur = ref('USD'); const user = useUser(); const router = useRouter(); const { t } = useI18n()
const vip = computed(() => vipState(user.token ? user.info : null))
// B13: always refresh user info here (Profile may not have been visited; a stale cached info would show non-VIP)
onMounted(async () => { if (user.token) getUserInfo().then(r => { if (r.code === 1) user.info = r.data }).catch(() => {})
  const [v, i] = await Promise.all([getVipList(), getInit()]); vips.value = v.data?.list || []; eligible.value = firstEligible(v.data); sel.value = vips.value.find(x => x.type === 'm') || vips.value[0]
  cur.value = listCurrency(v.data) || 'USD'; methods.value = payMethods(i.data, listCurrency(v.data)); method.value = methods.value[0]?.type || ''; loaded.value = true })
async function buy() { if (paying.value) return; if (!method.value) { toast(t('b7.pay.none')); return } if (!user.token) { toast(t('unlock.loginFirst')); router.push('/login'); return }
  const wasFirst = isFirst(sel.value, eligible.value); paying.value = true
  try { await startPayment({ type: 'member', pkgId: sel.value.id, price: effectivePrice(sel.value, eligible.value), currency: cur.value, payment: method.value, title: 'VIP ' + t('vip.' + sel.value.type) }) }
  catch (e: any) {
    // B16: show the real reason; "first price gone" only when the re-read server decision says so
    if (wasFirst) { await reloadVips().catch(() => {}); if (!eligible.value) { toastPay(t('b15.first.gone')); return } }
    toastPay(payErrorText(e, t))
  } finally { paying.value = false } }
// B15: server refused a first-purchase price (eligibility changed) -> re-read the server decision, keep the selected plan
async function reloadVips() { const id = sel.value?.id; const v = await getVipList(); vips.value = v.data?.list || []; eligible.value = firstEligible(v.data); sel.value = vips.value.find(x => x.id === id) || vips.value[0] }
</script>
