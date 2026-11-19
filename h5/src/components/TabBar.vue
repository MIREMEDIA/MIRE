<template><nav class="nav2" :class="{ dark }">
  <router-link v-for="t in tabs" :key="t.k" :to="t.to" :class="{ on: route.meta.tab === t.k, mid: t.k === 'shorts' }">
    <span class="ico"><Icon :name="t.i" :size="t.k === 'shorts' ? 26 : 24" :fill="route.meta.tab === t.k && t.k !== 'shorts' && t.k !== 'rewards'" /><i v-if="t.k === 'rewards'" class="dot"></i></span>{{ $t('tab.' + t.k) }}</router-link>
</nav></template>
<script setup lang="ts">
import { useRoute } from 'vue-router'
import Icon from './Icon.vue'
defineProps<{ dark?: boolean }>()
const route = useRoute()
const tabs = [ { k: 'home', to: '/', i: 'home' }, { k: 'mylist', to: '/mylist', i: 'list' }, { k: 'shorts', to: '/shorts', i: 'play' }, { k: 'rewards', to: '/rewards', i: 'gift' }, { k: 'me', to: '/me', i: 'user' } ]
</script>
