<template><section class="scr">
  <div class="top"><h1>{{ $t('mylist.title') }}</h1></div>
  <div class="tabs"><span :class="{ on: tab === 'fav' }" @click="tab = 'fav'">{{ $t('mylist.following') }}</span><span :class="{ on: tab === 'history' }" @click="tab = 'history'">{{ $t('mylist.history') }}</span></div>
  <div class="body">
    <p class="note" style="margin:0 16px 10px" v-if="!user.token">{{ $t('mylist.loginHint') }} <router-link to="/login" style="color:var(--red)">{{ $t('common.signin') }} ›</router-link></p>
    <div class="grid"><div v-for="h in list" :key="h.id" class="p" @click="$router.push({ path: `/play/${h.id}`, query: { ep: h.ep } })"><img loading="lazy" decoding="async" :src="h.image" referrerpolicy="no-referrer" /><span class="ep">{{ h.episodes ? `${h.ep}/${h.episodes}` : `EP ${h.ep}` }}</span>
      <span v-if="tab === 'fav'" class="unfav" :aria-label="$t('b7.unfav')" @click.stop="unfav(h)">✕</span><div class="t">{{ cleanTitle(h.title) }}</div><i class="bar" :style="{ width: (h.episodes ? Math.min(100, h.ep / h.episodes * 100) : 0) + '%' }"></i></div></div>
    <p class="empty" v-if="!list.length">{{ $t('common.empty') }}</p>
  </div></section></template>
<script setup lang="ts">
// B7 #6: one source of truth = the store; it merges the server favoriteList/logList on login/open (syncServer)
// and writes through /video/favorite, /video/delLog, /video/log.
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUser, type HistItem } from '../stores/user'
import { cleanTitle } from '../utils'
import { toast } from '../components/toast'
import { useI18n } from 'vue-i18n'
const user = useUser(); const route = useRoute(); const { t } = useI18n(); const tab = ref(route.query.tab === 'history' ? 'history' : 'fav')
const list = computed(() => (tab.value === 'fav' ? user.favorites : user.history))
const unfav = (h: HistItem) => { user.toggleFav(h); toast(t('player.removed')) }
onMounted(() => { if (user.token) user.syncServer() })
</script>
