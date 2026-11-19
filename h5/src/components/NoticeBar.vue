<template><div v-if="items.length" class="nbar" @click="open = items[idx]">
  <span class="nbic">📢</span><div class="nbtx"><span :key="idx">{{ items[idx].title }}</span></div><span class="nbgo">›</span>
  <Sheet v-if="open" :model-value="!!open" @update:model-value="open = null"><h3>{{ open.title }}</h3><p class="sub" v-if="open.time">{{ open.time }}</p><div class="nbbody" v-html="open.content"></div></Sheet>
</div></template>
<script setup lang="ts">
// Announcement bar fed by the backend's GET /index/notification (FastAdmin dramas addon). Hidden when the list is empty
// or the request fails; nothing is hard-coded.
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { getNotifications } from '../api'
import Sheet from './Sheet.vue'
const items = ref<{ id: any; title: string; content: string; time: string }[]>([]); const idx = ref(0); const open = ref<any>(null); let tm: any
const fmt = (v: any) => { const n = Number(v); if (!n) return String(v || ''); const d = new Date(n < 1e12 ? n * 1000 : n); return d.toISOString().slice(0, 10) }
const strip = (h: string) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
function mapNotice(x: any) {
  const content = String(x.content ?? x.body ?? x.desc ?? x.description ?? x.message ?? '')
  const title = String(x.title ?? x.name ?? x.subject ?? '') || strip(content).slice(0, 60)
  return { id: x.id, title, content: content || title, time: fmt(x.createtime ?? x.create_time ?? x.publishtime ?? x.updatetime ?? '') }
}
onMounted(async () => {
  try { const r = await getNotifications(); const d = r.code === 1 ? (Array.isArray(r.data) ? r.data : (r.data as any)?.list || (r.data as any)?.data || []) : []
    items.value = d.map(mapNotice).filter((x: any) => x.title) } catch { items.value = [] }
  if (items.value.length > 1) tm = setInterval(() => (idx.value = (idx.value + 1) % items.value.length), 4000)
})
onBeforeUnmount(() => clearInterval(tm))
</script>
