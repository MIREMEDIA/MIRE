<template><section class="scr">
  <div class="top"><span class="ic2" @click="$router.back()"><Icon name="back" /></span><h1>{{ $t('b7.wd.title') }}</h1></div>
  <div class="body" style="padding:0 16px 40px">
    <p v-if="!user.token" class="note">{{ $t('b7.loginFirst') }} <router-link to="/login" class="lnk">{{ $t('common.signin') }} ›</router-link></p>
    <template v-else>
      <div class="balc"><div><small>{{ $t('b7.wd.balance') }}</small><b>{{ user.info?.money ?? 0 }}</b><span>{{ cur }}</span></div></div>
      <p v-if="ruleLoaded && !methods.length" class="payempty">{{ $t('b7.wd.closed') }}</p>
      <template v-else>
        <p class="secT">{{ $t('b7.wd.method') }}</p>
        <div class="pays2"><div v-for="m in methods" :key="m.type" :class="{ on: type === m.type }" :data-b9="'wd-m-' + m.type" @click="type = m.type"><span>{{ ['wechat', 'alipay', 'bank'].includes(m.type) ? $t('b7.wd.t_' + m.type) : m.name }}</span></div></div>
        <p class="secT">{{ $t('b9.wd.currency') }}</p>
        <p v-if="!curs.length" class="payempty" data-b9="wd-nocur">{{ $t('b9.wd.noCurrency') }}</p>
        <div v-else class="pays2" data-b9="wd-curs"><div v-for="c in curs" :key="c.currency" :class="{ on: cur === c.currency }" :data-b9="'wd-c-' + c.currency" @click="cur = c.currency"><span>{{ c.currency }}</span></div></div>
        <p v-if="curObj" class="note">{{ $t('b9.wd.rate', { c: curObj.currency, r: curObj.rate }) }}</p>
        <div class="card2 bank"><template v-if="bank"><b>{{ bank.real_name }}</b><p>{{ bank.bank_name }} {{ bank.card_no }}</p></template><p v-else class="sub">{{ $t('b7.wd.noBank') }}</p>
          <button class="gob" @click="editing = !editing">{{ bank ? $t('b7.wd.editBank') : $t('b7.wd.addBank') }}</button></div>
        <div v-if="editing" class="card2"><div class="field"><input v-model="bf.real_name" :placeholder="$t('b7.wd.name')" /></div>
          <div class="field" v-if="type === 'bank'"><input v-model="bf.bank_name" :placeholder="$t('b7.wd.bankName')" /></div>
          <div class="field"><input v-model="bf.card_no" :placeholder="$t('b7.wd.account')" /></div>
          <button class="btn" @click="saveBank">{{ $t('common.confirm') }}</button></div>
        <p class="secT">{{ $t('b7.wd.amount') }}</p>
        <div class="field"><input v-model.number="amt" type="number" inputmode="decimal" min="0" /></div>
        <p class="note" v-if="rule">{{ $t('b7.wd.rule', { min: rule.min || 0, max: rule.max || '∞', fee: rule.service_fee || 0, perday: rule.perday_num || '∞' }) }}<span v-if="amt > 0"> · {{ $t('b7.wd.fee') }} {{ withdrawFee(rule, amt) }}</span></p>
        <button class="btn" style="margin-top:12px" :disabled="busy || !type || !cur" data-b9="wd-submit" @click="apply">{{ $t('b7.wd.submit') }}</button>
      </template>
      <p class="secT">{{ $t('b7.wd.records') }}</p>
      <div v-for="x in logs" :key="x.id" class="orow"><div class="m"><b>{{ x.money }}</b><p>{{ x.apply_sn || '' }} · {{ fmt(x.createtime) }}</p></div><span class="st">{{ x.status_text || x.status }}</span></div>
      <p class="empty" v-if="!logs.length">{{ $t('common.empty') }}</p>
    </template>
  </div></section></template>
<script setup lang="ts">
// B7 #9: FA /user_wallet_apply/rule -> {min,max,service_fee(%),perday_amount,perday_num,methods[]}; /user_bank/info?type=;
// /user_bank/edit; /user_wallet_apply/apply (type,money,currency); records = /user_wallet_apply/index
import { ref, computed, watch, onMounted } from 'vue'
import Icon from '../components/Icon.vue'
import { useUser } from '../stores/user'
import { wdApplyBody } from '../api/b10Core'
import { withdrawRule, withdrawApply, withdrawLog, bankInfo, bankEdit } from '../api/b7'
import { withdrawCheck, withdrawFee, pageRows, wdMethods, wdCurrencies } from '../api/b7Core'
import { getUserInfo } from '../api'
import { toast } from '../components/toast'
import { useI18n } from 'vue-i18n'
const { t } = useI18n(); const user = useUser()
const rule = ref<any>(null); const ruleLoaded = ref(false); const type = ref(''); const bank = ref<any>(null); const editing = ref(false)
const bf = ref<any>({ real_name: '', bank_name: '', card_no: '' }); const amt = ref<number>(0); const busy = ref(false); const logs = ref<any[]>([])
// B9 #4: FA methods = [{name,type}] (strings still accepted); currencies from currency_exchange_rate (only configured, rate>0)
const methods = computed(() => wdMethods(rule.value)); const curs = computed(() => wdCurrencies(rule.value)); const cur = ref('')
const curObj = computed(() => curs.value.find(c => c.currency === cur.value))
const fmt = (v: any) => (/^\d+$/.test(String(v)) ? new Date(Number(v) * 1000).toISOString().slice(0, 10) : String(v || ''))
async function loadBank() { if (!type.value) return; const r = await bankInfo(type.value); bank.value = r.code === 1 && r.data ? r.data : null; editing.value = false; if (bank.value) bf.value = { ...bank.value } }
async function loadLogs() { const r = await withdrawLog(); logs.value = pageRows(r.data) }
async function saveBank() { const r = await bankEdit({ ...bf.value, type: type.value }); toast(r.msg || (r.code === 1 ? t('b7.ok') : t('b7.fail'))); if (r.code === 1) loadBank() }
async function apply() {
  const e = withdrawCheck(rule.value, Number(amt.value)); if (e) return toast(t('b7.wd.e_' + e, { min: rule.value?.min, max: rule.value?.max }))
  if (Number(amt.value) > Number(user.info?.money || 0)) return toast(t('b7.wd.e_balance'))
  if (!bank.value) return toast(t('b7.wd.noBank'))
  if (!cur.value) return toast(t('b9.wd.noCurrency'))
  busy.value = true; const body = wdApplyBody(type.value, Number(amt.value), cur.value); if (!body) { busy.value = false; return toast(t('b9.wd.noCurrency')) }
  const r = await withdrawApply(body); busy.value = false
  toast(r.msg || (r.code === 1 ? t('b7.ok') : t('b7.fail'))); if (r.code === 1) { amt.value = 0; loadLogs(); const u = await getUserInfo(); if (u.code === 1) user.info = u.data }
}
watch(type, loadBank)
onMounted(async () => {
  if (!user.token) return
  if (!user.info) { const u = await getUserInfo(); if (u.code === 1) user.info = u.data }
  const r = await withdrawRule(); rule.value = r.data || null; ruleLoaded.value = true; type.value = methods.value[0]?.type || ''; cur.value = curs.value[0]?.currency || ''; loadLogs()
})
</script>
