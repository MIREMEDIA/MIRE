<template><section class="scr">
  <div class="top"><span class="ic2" @click="$router.back()"><Icon name="back" /></span><h1>{{ $t('b7.wlog.title') }}</h1></div>
  <div class="tabs"><span v-for="w in wallets" :key="w" :class="{ on: wt === w }" @click="wt = w">{{ $t('b7.wlog.' + w) }}</span></div>
  <div class="tabs sm"><span v-for="s in sts" :key="s" :class="{ on: st === s }" @click="st = s">{{ $t('b7.wlog.' + s) }}</span></div>
  <div class="body" style="padding:0 16px 40px">
    <p v-if="!user.token" class="note">{{ $t('b7.loginFirst') }} <router-link to="/login" class="lnk">{{ $t('common.signin') }} ›</router-link></p>
    <div v-for="x in rows" :key="x.id" class="orow"><div class="m"><b>{{ x.memo || x.type_text || x.type }}</b><p>{{ fmt(x.createtime) }}</p></div>
      <div class="r"><b :class="Number(x.wallet) >= 0 ? 'gold' : 'neg'">{{ Number(x.wallet) > 0 ? '+' : '' }}{{ x.wallet }}</b><small>{{ $t('b7.wlog.after') }} {{ x.after }}</small></div></div>
    <p class="empty" v-if="user.token && !loading && !rows.length">{{ $t('common.empty') }}</p>
    <button v-if="more" class="btn ghost" @click="load(page + 1)">{{ $t('b7.more') }}</button>
  </div></section></template>
<script setup lang="ts">
// B7 #8: FA /user_wallet_log/index (wallet_type usable|money|score, status all|add|reduce) -> data.wallet_logs (paginated)
import { ref, watch, onMounted } from 'vue'
import Icon from '../components/Icon.vue'
import { useUser } from '../stores/user'
import { walletLog } from '../api/b7'
import { pageRows } from '../api/b7Core'
const user = useUser(); const wallets = ['usable', 'money', 'score'] as const; const sts = ['all', 'add', 'reduce']
const wt = ref<'usable' | 'money' | 'score'>('usable'); const st = ref('all'); const rows = ref<any[]>([]); const page = ref(1); const more = ref(false); const loading = ref(true)
const fmt = (v: any) => (/^\d+$/.test(String(v)) ? new Date(Number(v) * 1000).toISOString().slice(0, 16).replace('T', ' ') : String(v || ''))
async function load(p = 1) {
  if (!user.token) { loading.value = false; return }
  loading.value = true; const r = await walletLog(wt.value, p, st.value); const d = r.data?.wallet_logs
  rows.value = p === 1 ? pageRows(d) : [...rows.value, ...pageRows(d)]; page.value = p; more.value = Number(d?.last_page || 1) > p; loading.value = false
}
watch([wt, st], () => load(1)); onMounted(() => load(1))
</script>
