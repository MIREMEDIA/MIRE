<script setup lang="ts">
// FE-M5 操作日志（FA admin_log）：列表 + 管理员/操作类型/时间筛选 + 分页 + 详情。接口规格：/workspace/fe_audit/m5/adminlog_api.md（adm.log.*）
import { computed, h, onMounted, reactive, ref } from 'vue'
import { NButton, NSelect, NInput, NDatePicker, NAlert, NDrawer, NDrawerContent, NDescriptions, NDescriptionsItem, NTag, useMessage } from 'naive-ui'
import { api } from '../api'
import { isMobile } from '../mobile'
import MTable from '../components/MTable.vue'
import { filterTypes, logTypeOf, logTypeLabel, logTitle } from '../logtypes'
import PageLoading from '../components/PageLoading.vue'
defineProps<{ page: any }>()
const msg = useMessage()
// 操作类型 = admin_log.url 里 r= 的前缀（新后台写入）或 FA 控制器（旧后台写入）；后端 adm.log.meta 可返回更全的列表
// FE-M8：类型中文统一由 logtypes.ts 提供（补齐 b3/cc；qa_magic_login 等后端归 other 的按 url 细分）
const TYPES0 = filterTypes(null)
const types = ref<any[]>(TYPES0); const admins = ref<any[]>([])
const f = reactive<{ admin_id: number | null; type: string | null; kw: string; range: [number, number] | null; page: number }>({ admin_id: null, type: null, kw: '', range: null, page: 1 })
const SIZE = 20
const rows = ref<any[]>([]); const total = ref(0); const loading = ref(true); const err = ref(''); const na = ref(false)
const det = ref<any>(null); const detLoading = ref(false)
const ts = (t: any) => t ? new Date(Number(t) * 1000).toLocaleString('zh-CN', { hour12: false }) : '—'
const tLabel = (v: string) => logTypeLabel(v, types.value)
const rLabel = (r: any) => r ? tLabel(logTypeOf(r)) : '—'
let seq = 0
async function load() {
  const my = ++seq; loading.value = true; err.value = ''
  const [s, e] = f.range || [null, null]
  try {
    const d: any = await api('adm.log.list', { admin_id: f.admin_id ?? undefined, type: f.type ?? undefined, kw: f.kw.trim(), start: s ? Math.floor(s / 1000) : undefined, end: e ? Math.floor(e / 1000) + 86399 : undefined, page: f.page, size: SIZE })
    if (my !== seq) return; rows.value = d.rows || []; total.value = d.total || 0; na.value = false
  } catch (x: any) { if (my !== seq) return; rows.value = []; total.value = 0; err.value = x.code === 403 ? '无权限：' + x.message : x.message }
  finally { if (my === seq) loading.value = false }
}
function search() { f.page = 1; load() }
function reset() { Object.assign(f, { admin_id: null, type: null, kw: '', range: null, page: 1 }); load() }
async function open(r: any) {
  det.value = { ...r }; detLoading.value = true
  try { det.value = await api('adm.log.get', { id: r.id }) } catch (x: any) { msg.error(x.message) } finally { detLoading.value = false }
}
const pretty = computed(() => { const c = det.value?.content; if (c === undefined || c === null || c === '') return ''
  if (typeof c === 'object') return JSON.stringify(c, null, 2); try { return JSON.stringify(JSON.parse(c), null, 2) } catch { return String(c) } })
const cols = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '时间', key: 'createtime', width: 170, render: (r: any) => ts(r.createtime) },
  { title: '管理员', key: 'username', width: 130, render: (r: any) => `${r.username || '—'}${r.admin_id ? ' #' + r.admin_id : ''}` },
  { title: '操作类型', key: 'type', width: 150, render: (r: any) => h(NTag, { size: 'small', bordered: false }, () => rLabel(r)) },
  { title: '标题', key: 'title', width: 220, ellipsis: { tooltip: true }, render: (r: any) => logTitle(r) },
  { title: 'IP', key: 'ip', width: 130 },
  { title: '操作', key: 'op', width: 90, render: (r: any) => h(NButton, { size: 'small', 'data-m5': 'log-detail', onClick: () => open(r) }, () => '详情') },
]
onMounted(async () => {
  api('adm.log.meta').then((m: any) => { if (m?.types?.length) types.value = filterTypes(m.types.map((t: any) => ({ label: t.label || t.title || t.key, value: t.key }))); admins.value = (m?.admins || []).map((a: any) => ({ label: `${a.nickname || a.username}（${a.username} #${a.id}）`, value: a.id })) }).catch(() => {})
  load()
})
</script>
<template>
  <div class="b8" data-m5="adminlog">
    <n-alert v-if="err" type="error" :bordered="false" style="margin-bottom:10px">{{ err }}</n-alert>
    <div class="b8-row m5-flt" style="margin:8px 0">
      <n-select v-model:value="f.admin_id" :options="admins" filterable clearable placeholder="管理员" style="width:200px" data-m5="f-admin" />
      <n-select v-model:value="f.type" :options="types" clearable placeholder="操作类型" style="width:190px" data-m5="f-type" />
      <n-date-picker v-model:value="f.range" type="daterange" clearable style="width:260px" data-m5="f-range" />
      <n-input v-model:value="f.kw" clearable placeholder="标题 / URL / IP" style="width:180px" data-m5="f-kw" @keyup.enter="search" />
      <n-button type="primary" :loading="loading" data-m5="search" @click="search">查询</n-button>
      <n-button @click="reset">重置</n-button>
    </div>
    <p class="muted" style="margin:6px 0" data-m5="total">共 {{ loading ? '—' : total }} 条</p>
    <MTable :loading="loading" :columns="cols" :data="rows" remote size="small" :row-key="(r: any) => r.id"
      :pagination="{ page: f.page, pageSize: SIZE, itemCount: total, onUpdatePage: (p: number) => { f.page = p; load() } }" />
    <n-drawer :show="!!det" :width="isMobile ? '100vw' : 560" placement="right" @update:show="(v: boolean) => !v && (det = null)">
      <n-drawer-content :title="'操作日志 #' + (det?.id ?? '')" closable data-m5="log-drawer">
        <PageLoading v-if="detLoading && !det?.content" :rows="4" />
        <template v-else>
          <n-descriptions :column="1" label-placement="left" size="small" bordered>
            <n-descriptions-item label="时间">{{ ts(det?.createtime) }}</n-descriptions-item>
            <n-descriptions-item label="管理员">{{ det?.username }} #{{ det?.admin_id }}</n-descriptions-item>
            <n-descriptions-item label="操作类型">{{ rLabel(det) }}</n-descriptions-item>
            <n-descriptions-item label="标题">{{ logTitle(det) }}</n-descriptions-item>
            <n-descriptions-item label="URL"><span style="word-break:break-all">{{ det?.url }}</span></n-descriptions-item>
            <n-descriptions-item label="IP">{{ det?.ip }}</n-descriptions-item>
            <n-descriptions-item label="UA"><span style="word-break:break-all">{{ det?.useragent || '—' }}</span></n-descriptions-item>
          </n-descriptions>
          <p style="margin:12px 0 4px"><b>内容</b></p>
          <pre class="m5-pre" data-m5="log-content">{{ pretty || '—' }}</pre>
        </template>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>
<style scoped>
.m5-flt{flex-wrap:wrap;gap:8px}
.m5-pre{background:#f6f7f9;border-radius:6px;padding:10px;font-size:12px;white-space:pre-wrap;word-break:break-all;max-height:50vh;overflow:auto;margin:0}
@media (max-width:767px){.m5-flt > *{width:100% !important}}
</style>
