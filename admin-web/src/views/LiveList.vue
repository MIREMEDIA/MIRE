<script setup lang="ts">
import { isMobile } from '../mobile'
import MTable from '../components/MTable.vue'
import { h, onMounted, reactive, ref } from 'vue'
import { NCard, NInput, NSelect, NButton, NDatePicker, NTag, NAlert, NSpace, NImage, type DataTableColumns } from 'naive-ui'
import { api } from '../api'
import type { PageSpec } from '../menu'
const props = defineProps<{ page: PageSpec; res: string }>()
// Labels, kinds and enum values all come from the server registry (api/schema.php), which mirrors the real DB.
const q = reactive<any>({ kw: '', paid: null, range: null as null | [number, number], f: {} as Record<string, any> })
const pg = reactive({ page: 1, pageSize: 20, itemCount: 0, showSizePicker: true, pageSizes: [20, 50, 100], prefix: () => loading.value ? '共 — 条' : `共 ${capped.value ? pg.itemCount.toLocaleString() + '+' : pg.itemCount.toLocaleString()} 条` })
const rows = ref<any[]>([]), cols = ref<DataTableColumns<any>>([]), loading = ref(true), err = ref(''), meta = ref<any>({}), capped = ref(false)
const langs = ref<Record<string, string>>({})
const opt = (o: any) => Object.entries(o || {}).map(([v, l]: any) => ({ value: v, label: Array.isArray(l) ? l[0] : l }))
const fmtTime = (v: any) => { const n = Number(v); if (!n) return '—'; return new Date(n * 1000).toLocaleString('zh-CN', { hour12: false }) }
const day = (t: number) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
function cell(c: any, v: any) {
  if (v === null || v === undefined || v === '') return '—'
  switch (c.kind) {
    case 'time': return fmtTime(v)
    case 'money': return Number(v).toFixed(2)
    case 'num': return Number(v).toLocaleString('en-US')
    case 'lang': return langs.value[String(v)] || String(v)
    case 'img': return /^(https?:)?\/\//.test(String(v)) ? h(NImage, { src: String(v), width: 36, height: 36, objectFit: 'cover', style: 'border-radius:4px' }) : String(v)
    case 'enum': {
      const e = c.enum?.[String(v)]
      if (!e) return String(v)
      return Array.isArray(e) ? h(NTag, { size: 'small', type: e[1], bordered: false }, () => e[0]) : e
    }
    default: return String(v)
  }
}
async function load() {
  loading.value = true; err.value = ''
  try {
    const p: any = { res: props.res, kw: q.kw, paid: q.paid, from: q.range ? day(q.range[0]) : '', to: q.range ? day(q.range[1]) : '', page: pg.page, size: pg.pageSize }
    for (const [k, v] of Object.entries(q.f)) {
      const f = (meta.value.filters || []).find((x: any) => x.key === k)
      if (v !== null && v !== '' && v !== undefined) p[(f?.type === 'flag' ? 'flag_' : 'f_') + k] = v
    }
    const d: any = await api('list', p)
    meta.value = d; pg.itemCount = d.total; capped.value = !!d.total_capped; rows.value = d.rows
    cols.value = d.columns.map((c: any) => ({ title: c.label, key: c.key, ellipsis: c.kind === 'img' ? undefined : { tooltip: true }, width: c.kind === 'id' ? 80 : c.kind === 'time' ? 170 : undefined, minWidth: 100, render: (r: any) => cell(c, r[c.key]) }))
  } catch (e: any) { err.value = e.message } finally { loading.value = false }
}
function search() { pg.page = 1; load() }
function reset() { Object.assign(q, { kw: '', paid: null, range: null, f: {} }); search() }
// FE-M4：原先先 await langs 再 load（两次往返串行）；改为并行，语种名到达后单元格响应式刷新
onMounted(() => {
  api('langs').then((l: any[]) => { l.forEach(x => { langs.value[String(x.id)] = x.name || x.lang || String(x.id) }) }).catch(() => { /* optional */ })
  load()
})
</script>
<template>
  <n-card size="small">
    <template #header><span>{{ page.t }}</span> <span class="muted" style="margin-left:8px">数据表 {{ meta.table || '—' }} · 只读</span></template>
    <n-space style="margin-bottom:12px" :wrap="true" :class="{ 'm-filters': isMobile }">
      <n-input v-if="meta.kw_fields?.length" v-model:value="q.kw" :placeholder="'搜索：' + meta.kw_fields.map((k:string)=>(meta.columns||[]).find((c:any)=>c.key===k)?.label||k).join(' / ')" clearable style="width:260px" @keyup.enter="search" />
      <template v-for="f in meta.filters || []" :key="f.key">
        <n-select v-if="f.type==='enum'" v-model:value="q.f[f.key]" clearable :placeholder="f.label" style="width:130px" :options="opt(f.options)" />
        <n-select v-else-if="f.type==='flag'" v-model:value="q.f[f.key]" clearable :placeholder="f.label" style="width:120px" :options="[{label:'是',value:'1'},{label:'否',value:'0'}]" />
        <n-input v-else v-model:value="q.f[f.key]" clearable :placeholder="f.label" style="width:110px" @keyup.enter="search" />
      </template>
      <n-select v-if="meta.paid_filter" v-model:value="q.paid" clearable placeholder="是否已付" style="width:120px" :options="[{label:'已付(1,2)',value:'1'},{label:'未付',value:'0'}]" />
      <n-date-picker v-if="meta.created_col" v-model:value="q.range" type="daterange" clearable start-placeholder="开始日期" end-placeholder="结束日期" style="width:260px" />
      <n-button type="primary" @click="search">查询</n-button>
      <n-button @click="reset">重置</n-button>
    </n-space>
    <n-alert v-if="err" type="error" style="margin-bottom:12px">{{ err }}</n-alert>
    <n-alert v-if="meta.missing_cols?.length" type="warning" style="margin-bottom:12px">线上表缺少字段（已跳过）：{{ meta.missing_cols.join(', ') }}</n-alert>
    <m-table remote :loading="loading" :columns="cols" :data="rows" :pagination="pg" :row-key="(r:any)=>r.id" :scroll-x="Math.max(1200, cols.length * 120)" size="small" striped
      @update:page="(p:number)=>{pg.page=p;load()}" @update:page-size="(s:number)=>{pg.pageSize=s;pg.page=1;load()}" />
    <div class="muted" style="margin-top:8px">只读：编辑 / 新增 / 删除等写操作将在正式迁移后开放；邮箱、手机号已脱敏，密码/卡密/支付原始数据不返回。<span v-if="capped">筛选结果超过 1 万条仅显示“10000+”，翻页最多到第 10 万条。</span></div>
  </n-card>
</template>
