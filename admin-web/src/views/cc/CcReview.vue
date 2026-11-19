<script setup lang="ts">
import { isMobile } from '../../mobile'
import MTable from '../../components/MTable.vue'
import { h, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { NCard, NSelect, NInput, NButton, NSpace, NTag, NAlert, NImage, NGrid, NGi, NStatistic } from 'naive-ui'
import { api } from '../../api'
import { asset, bandLabel, pubStatus, slaText, fmtTime, langName } from '../../cc'
const router = useRouter()
const f = reactive({ status: 'todo', band: null as string | null, sla: null as string | null, q: '' })
const rows = ref<any[]>([]), loading = ref(false), err = ref(''), ov = ref<any>({})
const tag = (m: any) => (m ? h(NTag, { size: 'small', type: m[1], bordered: false }, () => m[0]) : '—')
const cols: any[] = [
  { title: '封面', key: 'cover', width: 64, render: (r: any) => h(NImage, { src: asset(r.cover), width: 40, height: 56, objectFit: 'cover', style: 'border-radius:4px', previewDisabled: true }) },
  { title: '作品', key: 'title', minWidth: 200, render: (r: any) => h('div', [h('a', { class: 'lnk', onClick: () => open(r) }, r.title), h('div', { class: 'muted' }, `#${r.id} · v${r.version} · ${r.episodes} 集 · ${langName[r.lang] || r.lang}`)]) },
  { title: '创作者', key: 'creator', width: 130, render: (r: any) => r.creator?.display_name || '—' },
  { title: '状态', key: 'status', width: 110, render: (r: any) => tag(pubStatus[r.status]) },
  { title: 'AI 风险', key: 'score', width: 150, render: (r: any) => h(NSpace, { size: 4, align: 'center' }, () => [h('b', { style: `color:${r.score > 70 ? '#FF2C48' : r.score >= 30 ? '#E6A23C' : '#18A058'}` }, String(r.score)), tag(bandLabel[r.band])]) },
  { title: '风险类别', key: 'categories', minWidth: 160, render: (r: any) => Object.keys(r.categories || {}).join('、') || '—' },
  { title: 'SLA (48h)', key: 'sla_left', width: 130, render: (r: any) => { const s = slaText(r.sla_left); return h(NTag, { size: 'small', type: s.type, bordered: false }, () => s.t) } },
  { title: '定价', key: 'price', width: 200, render: (r: any) => `前 ${r.free_episodes} 集免费（设定 ${r.free_episodes_set ?? r.free_episodes} 集）· ${r.price_per_episode} 币/集` },
  { title: '提交时间', key: 'submitted_at', width: 160, render: (r: any) => fmtTime(r.submitted_at) },
  { title: '处理人', key: 'assignee', width: 90, render: (r: any) => r.assignee || '—' },
  { title: '操作', key: 'op', width: 80, fixed: 'right', render: (r: any) => h(NButton, { size: 'small', type: 'primary', onClick: () => open(r) }, () => '审核') },
]
function open(r: any) { router.push({ path: '/p/cc_review', query: { id: r.id } }) }
async function load() {
  loading.value = true; err.value = ''
  try { const d: any = await api('cc.review.list', { ...f }); rows.value = d.items; ov.value = await api('cc.overview') } catch (e: any) { err.value = e.message } finally { loading.value = false }
}
onMounted(load)
</script>
<template>
  <n-grid :cols="isMobile ? 2 : 5" :x-gap="12" :y-gap="isMobile ? 10 : 0" style="margin-bottom:12px">
    <n-gi><n-card size="small"><n-statistic label="待审核（普通队列）" :value="ov.publish?.pending || 0" /></n-card></n-gi>
    <n-gi><n-card size="small"><n-statistic label="重点审核（30–70）" :value="ov.publish?.focus || 0" /></n-card></n-gi>
    <n-gi><n-card size="small"><n-statistic label="SLA 已超时"><span :style="{ color: ov.sla_overdue ? '#FF2C48' : '' }">{{ ov.sla_overdue || 0 }}</span></n-statistic></n-card></n-gi>
    <n-gi><n-card size="small"><n-statistic label="AI 自动驳回（>70）" :value="ov.publish?.auto_rejected || 0" /></n-card></n-gi>
    <n-gi><n-card size="small"><n-statistic label="已通过" :value="ov.publish?.approved || 0" /></n-card></n-gi>
  </n-grid>
  <n-card size="small" title="作品审核队列">
    <template #header-extra><span class="muted">AI 预审 → 人工审核 · 风险 &lt;30 普通队列 / 30–70 重点审核 / &gt;70 自动驳回 · SLA 48 小时</span></template>
    <n-space style="margin-bottom:12px" :class="{ 'm-filters': isMobile }">
      <n-select v-model:value="f.status" style="width:150px" :options="[{label:'待处理（全部）',value:'todo'},{label:'全部状态',value:'all'},...Object.entries(pubStatus).map(([v,l])=>({value:v,label:l[0]}))]" />
      <n-select v-model:value="f.band" clearable placeholder="风险档位" style="width:150px" :options="Object.entries(bandLabel).map(([v,l])=>({value:v,label:l[0]}))" />
      <n-select v-model:value="f.sla" clearable placeholder="SLA" style="width:140px" :options="[{label:'已超时',value:'overdue'},{label:'12 小时内到期',value:'soon'}]" />
      <n-input v-model:value="f.q" clearable placeholder="作品名 / 创作者" style="width:200px" @keyup.enter="load" />
      <n-button type="primary" @click="load">查询</n-button>
    </n-space>
    <n-alert v-if="err" type="error" :title="err" style="margin-bottom:12px" />
    <m-table :columns="cols" :data="rows" :loading="loading" size="small" :scroll-x="1600" :row-key="(r:any)=>r.id" />
  </n-card>
</template>
<style scoped>
:deep(.lnk){color:#FF2C48;cursor:pointer;font-weight:600}
</style>
