<template><section class="scr">
  <div class="body">
    <div class="phead"><div class="top0"><div style="flex:1"></div><router-link class="ic2" to="/language"><Icon name="globe" /></router-link></div>
      <div class="prof2" @click="!user.token && $router.push('/login')"><div class="av2"><img v-if="user.info?.avatar" :src="user.info.avatar" /><Icon v-else name="user" :size="34" /></div>
        <div style="flex:1"><b>{{ user.info?.nickname || $t('me.guest') }}</b><p>{{ user.token ? 'ID ' + (user.info?.id || '') : $t('me.signinHint') }}</p></div><span v-if="!user.token" class="pillr">{{ $t('common.signin') }}</span></div>
      <div class="walletc"><div><small>{{ $t('wallet.coins') }}</small><b>🪙 {{ user.info?.usable ?? 0 }}</b></div><router-link to="/wallet" class="pillr">{{ $t('me.topup') }}</router-link></div>
      <div class="vipbar2" @click="$router.push('/vip')"><Icon name="crown" :size="26" fill /><div class="m"><b>{{ vip.active ? $t('b13.vip.active') : 'MIRE VIP' }}</b><p data-t="vip-status">{{ vip.active ? $t('b13.vip.until', { d: fmtVipDate(vip.until) }) : $t('me.vipDesc') }}</p></div><span class="joinb">{{ vip.active ? $t('b13.vip.renew') : $t('me.vipJoin') }}</span></div>
    </div>
    <div class="studiocard" data-t="studio-entry" @click="goStudio"><div class="m"><span class="newb">NEW</span><b>{{ $t('m3.studio.title') }}</b><p>{{ $t('m3.studio.desc') }}</p></div><span class="pillr">{{ $t('m3.studio.cta') }}</span></div>
    <div class="qgrid"><router-link to="/mylist?tab=history"><span><Icon name="history" /></span>{{ $t('mylist.history') }}</router-link><router-link to="/mylist"><span><Icon name="list" /></span>{{ $t('mylist.following') }}</router-link><router-link to="/wallet"><span><Icon name="wallet" /></span>{{ $t('wallet.title') }}</router-link><router-link to="/rewards"><span><Icon name="gift" /></span>{{ $t('rewards.title') }}</router-link></div>
    <div class="list2">
      <div data-t="games-entry" @click="$router.push('/games')"><Icon name="play" :size="20" /><span>{{ $t('m3.games.title') }}</span><Icon name="right" :size="16" /></div>
      <div @click="$router.push('/orders')"><Icon name="doc" :size="20" /><span>{{ $t('b7.orders.title') }}</span><Icon name="right" :size="16" /></div>
      <div @click="$router.push('/walletlog')"><Icon name="coin" :size="20" /><span>{{ $t('b7.wlog.title') }}</span><Icon name="right" :size="16" /></div>
      <div @click="$router.push('/withdraw')"><Icon name="wallet" :size="20" /><span>{{ $t('b7.wd.title') }}</span><Icon name="right" :size="16" /></div>
      <div @click="$router.push('/invite')"><Icon name="gift" :size="20" /><span>{{ $t('b7.invite.title') }}</span><Icon name="right" :size="16" /></div>
      <div v-if="user.token" @click="$router.push('/settings')"><Icon name="user" :size="20" /><span>{{ $t('b7.settings.title') }}</span><Icon name="right" :size="16" /></div>
      <div @click="$router.push('/language')"><Icon name="globe" :size="20" /><span>{{ $t('me.lang') }}</span><em>{{ curLang }}</em><Icon name="right" :size="16" /></div>
      <div @click="$router.push('/doc/contact')"><Icon name="help" :size="20" /><span>{{ $t('me.contact') }}</span><Icon name="right" :size="16" /></div>
      <div @click="$router.push('/doc/terms')"><Icon name="doc" :size="20" /><span>{{ $t('me.terms') }}</span><Icon name="right" :size="16" /></div>
      <div @click="$router.push('/doc/privacy')"><Icon name="lock" :size="20" /><span>{{ $t('me.privacy') }}</span><Icon name="right" :size="16" /></div>
      <div @click="$router.push('/doc/about')"><Icon name="info" :size="20" /><span>{{ $t('me.about') }}</span><em>v2.0.0-staging</em><Icon name="right" :size="16" /></div>
      <div v-if="user.token" @click="user.logout()"><Icon name="logout" :size="20" /><span>{{ $t('me.logout') }}</span></div>
    </div>
  </div></section></template>
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useUser } from '../stores/user'
import { getUserInfo } from '../api'
import { vipState, fmtVipDate } from '../vipState'
import { LANGS } from '../i18n'
import Icon from '../components/Icon.vue'
const user = useUser(); const { locale } = useI18n(); const router = useRouter()
const curLang = computed(() => LANGS.find(l => l.code === locale.value)?.name)
onMounted(async () => { if (user.token) { const r = await getUserInfo(); if (r.code === 1) user.info = r.data } })
const vip = computed(() => vipState(user.token ? user.info : null))
/** FE-M3: Studio entry — guest -> #/login?redirect=/studio; logged-in -> /studio bridge (same-tab). */
function goStudio() { router.push('/studio') }
</script>
