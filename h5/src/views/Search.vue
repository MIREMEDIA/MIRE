<template><section class="scr">
  <div class="top"><span class="ic2" @click="$router.back()"><Icon name="back" /></span><form class="inp" @submit.prevent="run(q)">🔍<input v-model="q" :placeholder="$t('search.ph')" enterkeyhint="search" /></form><a style="font-size:14px;color:var(--red)" @click="run(q)">{{ $t('search.btn') }}</a></div>
  <div class="body">
    <template v-if="!searched">
      <div class="sec" v-if="recent.length"><h2>{{ $t('search.recent') }}</h2><span @click="clear">{{ $t('search.clear') }}</span></div>
      <div style="padding:0 16px"><span class="chip" v-for="r in recent" :key="r" @click="run(r)">{{ r }}</span></div>
      <div class="sec"><h2>🔥 {{ $t('search.trend') }}</h2></div>
      <div v-for="(d, i) in trend" :key="d.id" class="rank" @click="$router.push(`/play/${d.id}`)"><span class="n" :class="{ h: i < 3 }">{{ i + 1 }}</span><div class="p"><img :src="d.image" loading="lazy" referrerpolicy="no-referrer" /></div><div class="m"><b>{{ cleanTitle(d.title) }}</b><p>{{ (d.category_text_arr || []).join(' · ') }}</p><p style="color:var(--red)">🔥 {{ compact(d.hots) }}</p></div></div>
    </template>
    <template v-else><p class="empty" v-if="loading">{{ $t('common.loading') }}</p><p class="empty" v-else-if="!res.length">{{ $t('search.none', { q: last }) }}</p><div class="grid" style="margin-top:6px"><Poster v-for="d in res" :key="d.id" :d="d" /></div></template>
  </div></section></template>
<script setup lang="ts">
import Icon from '../components/Icon.vue'
import { ref, onMounted } from 'vue'
import { getList } from '../api'
import Poster from '../components/Poster.vue'
import { compact, cleanTitle } from '../utils'
const q = ref(''); const last = ref(''); const res = ref<any[]>([]); const trend = ref<any[]>([]); const searched = ref(false); const loading = ref(false)
const recent = ref<string[]>(JSON.parse(localStorage.getItem('mire_search') || '[]'))
const clear = () => { recent.value = []; localStorage.removeItem('mire_search') }
async function run(s: string) { s = s.trim(); if (!s) return; q.value = s; last.value = s; searched.value = true; loading.value = true
  recent.value = [s, ...recent.value.filter(x => x !== s)].slice(0, 10); localStorage.setItem('mire_search', JSON.stringify(recent.value))
  const r = await getList({ search: s, page: 1, pagesize: 30 }); res.value = r.data || []; loading.value = false }
onMounted(async () => { const r = await getList({ type: 'top', page: 1, pagesize: 10 }); trend.value = (r.data || []).slice(0, 10) })
</script>
