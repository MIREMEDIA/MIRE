<template><section class="scr">
  <div class="top"><span class="ic2" @click="$router.back()"><Icon name="back" /></span><h1>{{ $t('b7.invite.title') }}</h1></div>
  <div class="body" style="padding:0 16px 40px">
    <p v-if="!user.token" class="note">{{ $t('b7.loginFirst') }} <router-link to="/login" class="lnk">{{ $t('common.signin') }} ›</router-link></p>
    <template v-else>
      <div class="card2 invc"><small>{{ $t('b7.invite.code') }}</small><b class="icode">{{ uid }}</b>
        <p class="sub" v-if="reward > 0">{{ $t('b7.invite.rule', { n: reward }) }}<span v-if="limit > 0"> · {{ $t('b7.invite.limit', { n: limit }) }}</span></p>
        <p class="sub" v-else-if="actLoaded">{{ $t('b7.invite.off') }}</p>
        <div class="linkbox">{{ link }}</div>
        <div class="row2b"><button class="btn" @click="doShare">{{ $t('common.share') }}</button><button class="btn ghost" @click="copy(String(uid))">{{ $t('b7.invite.copyCode') }}</button></div></div>
      <div class="card2"><div class="ch2"><b>{{ $t('b7.invite.list') }}</b><small>{{ $t('b7.invite.total', { n: total, c: earned }) }}</small></div>
        <div v-for="x in list" :key="x.id" class="irow"><div class="av2 sm"><img v-if="x.avatar" :src="x.avatar" /><Icon v-else name="user" :size="18" /></div><div class="m"><b>{{ x.nickname || ('ID ' + x.uid) }}</b><p>{{ x.time }}</p></div><span class="gold" v-if="x.reward">+{{ x.reward }} 🪙</span></div>
        <p class="empty" v-if="!loading && !list.length">{{ $t('b7.invite.none') }}</p>
        <button v-if="more" class="btn ghost" @click="load(page + 1)">{{ $t('b7.more') }}</button></div>
    </template>
  </div><ShareSheet ref="sh" /></section></template>
<script setup lang="ts">
// B7 #5: invite code = my user id (FA spm first field); link carries spm=<uid>.1.0.1.3 (+ link_sign passthrough).
// Invited list = /share/index (sharer = me); rewards = activity.share.usable from /job/index and wallet log type=invite.
import { ref, computed, onMounted } from 'vue'
import Icon from '../components/Icon.vue'
import ShareSheet from '../components/ShareSheet.vue'
import { useUser } from '../stores/user'
import { getInvites, getJobs, walletLog } from '../api/b7'
import { buildShareUrl, pageRows } from '../api/b7Core'
import { getUserInfo } from '../api'
import { copyText } from '../api/share'
import { toast } from '../components/toast'
import { useI18n } from 'vue-i18n'
const { t } = useI18n(); const user = useUser(); const sh = ref<InstanceType<typeof ShareSheet>>()
const list = ref<any[]>([]); const page = ref(1); const more = ref(false); const loading = ref(true); const total = ref(0); const earned = ref(0)
const reward = ref(0); const limit = ref(0); const actLoaded = ref(false)
const uid = computed(() => user.info?.id || user.info?.user_id || '')
const link = computed(() => buildShareUrl(location, { uid: uid.value, page: 'home', linkSign: localStorage.getItem('mire_link_sign') || '' }))
const fmt = (v: any) => (/^\d+$/.test(String(v)) ? new Date(Number(v) * 1000).toISOString().slice(0, 10) : String(v || '').slice(0, 10))
async function load(p = 1) {
  loading.value = true; const r = await getInvites(p); const d = r.data || {}
  const rows = pageRows(d).map((x: any) => ({ id: x.id, uid: x.user_id, nickname: x.user?.nickname, avatar: x.user?.avatar, time: fmt(x.createtime), reward: 0 }))
  list.value = p === 1 ? rows : [...list.value, ...rows]; page.value = p; total.value = Number(d.total ?? list.value.length); more.value = Number(d.last_page || 1) > p; loading.value = false
}
async function loadEarned() { const r = await walletLog('usable', 1, 'all', 100); const rows = pageRows(r.data?.wallet_logs).filter((x: any) => x.type === 'invite'); earned.value = rows.reduce((a: number, x: any) => a + Number(x.wallet || 0), 0) }
async function doShare() { await sh.value?.share(link.value, t('b7.invite.shareText')) }
async function copy(s: string) { toast(t((await copyText(s)) ? 'common.copied' : 'b7.share.copyFail')) }
onMounted(async () => {
  if (!user.token) return
  if (!user.info) { const r = await getUserInfo(); if (r.code === 1) user.info = r.data?.userinfo || r.data }
  load(); loadEarned().catch(() => {})
  const j = await getJobs(); const a = j.data?.activity?.share; actLoaded.value = true
  if (a && String(a.status) === '1') { reward.value = Number(a.usable) || 0; limit.value = Number(a.limit) || 0 }
})
</script>
