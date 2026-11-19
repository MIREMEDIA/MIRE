<template><section class="scr">
  <div class="top"><span class="ic2" @click="$router.back()"><Icon name="back" /></span><h1>{{ $t('wallet.title') }}</h1></div>
  <div class="body" style="padding:0 16px 40px">
    <div class="balc"><div><small>{{ $t('wallet.balance') }}</small><b>🪙 {{ user.info?.usable ?? 0 }}</b><span>{{ $t('wallet.coins') }}</span></div><div class="coins3 sm">🪙</div></div>
    <div class="row3l"><router-link to="/walletlog">{{ $t('b7.wlog.title') }}</router-link><router-link to="/orders">{{ $t('b7.orders.title') }}</router-link><router-link to="/withdraw">{{ $t('b7.wd.title') }}</router-link></div>
    <p class="secT">{{ $t('unlock.topup') }}</p><PayPanel />
  </div></section></template>
<script setup lang="ts">
import { onMounted } from 'vue'
import PayPanel from '../components/PayPanel.vue'
import Icon from '../components/Icon.vue'
import { useUser } from '../stores/user'
import { getUserInfo } from '../api'
const user = useUser()
onMounted(async () => { if (user.token) { const r = await getUserInfo(); if (r.code === 1) user.info = r.data } })
</script>
