<template><section class="scr">
  <div class="top"><h1>{{ $t('list.title') }}</h1><router-link class="ic" to="/search">🔍</router-link></div>
  <div class="tabs"><span :class="{ on: type === '' }" @click="setType('')">{{ $t('common.all') }}</span><span :class="{ on: type === 'top' }" @click="setType('top')">{{ $t('search.trend') }}</span><span :class="{ on: type === 'recommend' }" @click="setType('recommend')">{{ $t('home.foryou') }}</span></div>
  <div class="body" @scroll="onScroll">
    <div style="padding:4px 16px"><span class="chip" :class="{ on: !cat }" @click="setCat(0)">{{ $t('common.all') }}</span><span v-for="c in cats" :key="c.id" class="chip" :class="{ on: cat === c.id }" @click="setCat(c.id)">{{ $st(c.name) }}</span></div>
    <div class="grid"><Poster v-for="d in items" :key="d.id" :d="d" /></div>
    <p class="empty" v-if="loading">{{ $t('common.loading') }}</p><p class="empty" v-else-if="!items.length">{{ $t('common.empty') }}</p><p class="empty" v-else-if="done">{{ $t('common.nomore') }}</p>
  </div></section></template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getList, getCategories } from '../api'
import Poster from '../components/Poster.vue'
defineOptions({ name: 'Discover' })
const route = useRoute()
const items = ref<any[]>([]); const cats = ref<any[]>([]); const cat = ref<number>(Number(route.query.c) || 0); const type = ref<any>(route.query.t || ''); const page = ref(1); const loading = ref(false); const done = ref(false)
async function load(reset = false) { if (loading.value || (done.value && !reset)) return; if (reset) { page.value = 1; items.value = []; done.value = false }
  loading.value = true; const r = await getList({ page: page.value, pagesize: 18, category_id: cat.value || undefined, type: type.value || undefined }); loading.value = false
  const d = r.data || []; const seen = new Set(items.value.map(x => x.id)); items.value.push(...d.filter((x: any) => !seen.has(x.id))); if (d.length < 18 || type.value) done.value = true; page.value++ }
const setCat = (c: number) => { cat.value = c; load(true) }
const setType = (t: string) => { type.value = t; load(true) }
const onScroll = (e: Event) => { const el = e.target as HTMLElement; if (el.scrollTop + el.clientHeight > el.scrollHeight - 300) load() }
onMounted(async () => { getCategories().then(r => (cats.value = r.data?.[0]?.children || [])); load(true) })
</script>
