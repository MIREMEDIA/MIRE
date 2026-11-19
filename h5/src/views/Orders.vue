<template><section class="scr">
  <div class="top"><span class="ic2" @click="$router.back()"><Icon name="back" /></span><h1>{{ $t('b7.orders.title') }}</h1></div>
  <div class="tabs"><span :class="{ on: tab === 'integral' }" @click="tab = 'integral'">{{ $t('b7.orders.coins') }}</span><span :class="{ on: tab === 'member' }" @click="tab = 'member'">VIP</span></div>
  <div class="body" style="padding:0 16px 40px">
    <p v-if="!user.token" class="note">{{ $t('b7.loginFirst') }} <router-link to="/login" class="lnk">{{ $t('common.signin') }} ›</router-link></p>
    <div v-for="o in rows" :key="o.order_sn" class="orow"><div class="m"><b>{{ o.title || o.order_sn }}</b><p>{{ o.order_sn }} · {{ o.time }}</p></div>
      <div class="r"><b>{{ o.price }}</b><span class="st" :class="o.state">{{ $t('b7.orders.' + o.state) }}</span>
        <button v-if="o.state === 'unpaid'" class="gob" :disabled="!method || paying === o.order_sn" data-t="order-pay" @click="resume(o)">{{ $t('b7.orders.continue') }}</button></div></div>
    <div class="oerr" v-if="user.token && !loading && loadErr" data-t="orders-error"><p>{{ loadErr }}</p><button class="gob" @click="load">{{ $t('b7.retry') }}</button></div>
    <p class="empty" v-else-if="user.token && !loading && !rows.length">{{ $t('common.empty') }}</p>
    <p class="note" v-if="user.token && methodsLoaded && !method">{{ $t('b7.pay.none') }}</p>
  </div></section></template>
<script setup lang="ts">
// B8 #2: all orders (paid + unpaid) come from FA /usable/order_list & /vip_order/index with include_unpaid=1.
// The server is the only source of truth; the B7 localStorage cache (mire_pending_orders) is cleared.
import { ref, computed, watch, onMounted } from 'vue'
import Icon from '../components/Icon.vue'
import { useUser } from '../stores/user'
import { coinOrders, vipOrders } from '../api/b7'
import { orderState, payMethods, pageRows } from '../api/b7Core'
import { payOrder, clearLegacyPending } from '../api/pay'
import { getInit } from '../api'
import { money } from '../utils'
import { toastPay } from '../components/toast'
import { payErrorText } from '../payError'
import { useI18n } from 'vue-i18n'
import { errText } from '../i18n/fem1'
const { t } = useI18n(); const user = useUser(); const tab = ref<'integral' | 'member'>('integral'); const loading = ref(true)
const srv = ref<any[]>([]); const method = ref(''); const methodsLoaded = ref(false)
const fmt = (ts: any) => { const n = Number(ts); const d = n ? new Date(n > 1e12 ? n : n * 1000) : new Date(String(ts).replace(' ', 'T')); return isNaN(+d) ? '' : d.toISOString().slice(0, 16).replace('T', ' ') }
const rows = computed(() => srv.value); const loadErr = ref('')
async function load() {
  if (!user.token) { loading.value = false; return }
  loading.value = true; loadErr.value = ''
  let r: any
  try { r = await (tab.value === 'integral' ? coinOrders() : vipOrders()) } catch { r = { code: 0, msg: '' } }
  // FE-M1 H-S1: a failed request (e.g. 402 guest) used to fall through to the empty state — show it instead
  if (r.code !== 1) { srv.value = []; loadErr.value = /guest/i.test(String(r.msg)) ? t('fem1.loginAgain') : errText(r.msg, t('fem1.loadFail')); loading.value = false; return }
  srv.value = pageRows(r.data).map((o: any) => ({ order_sn: o.order_sn, title: tab.value === 'integral' ? `🪙 ${o.usable ?? o.total_usable ?? ''}` : `VIP ${o.vip_title ?? o.title ?? ''}`, price: money(o.total_fee ?? o.pay_fee ?? o.price ?? 0, o.pay_currency || 'USD'), time: fmt(o.createtime), state: orderState(o) }))
  loading.value = false
}
const paying = ref('')  // B16
async function resume(o: any) { if (paying.value) return; paying.value = o.order_sn; try { await payOrder(o.order_sn, method.value) } catch (e: any) { toastPay(payErrorText(e, t)) } finally { paying.value = '' } }
watch(tab, load)
onMounted(async () => { clearLegacyPending(); load(); const i = await getInit(); const m = payMethods(i.data); method.value = m[0]?.type || ''; methodsLoaded.value = true })
</script>
