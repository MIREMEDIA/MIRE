<script setup lang="ts">
// Drop-in for <n-data-table>: desktop renders NDataTable untouched (all attrs/events pass through);
// phones (<768px) render the same columns as stacked cards (label: value), action column full-width at the bottom.
import { computed, h, ref, useAttrs, watch, type VNodeChild } from 'vue'
const emptyText = localStorage.getItem('mire_lang') === 'en' ? 'No data' : '无数据'
import { NDataTable, NPagination, NSpin, NEmpty } from 'naive-ui'
import { isMobile } from '../mobile'
import PageLoading from './PageLoading.vue'
defineOptions({ inheritAttrs: false })
const a = useAttrs() as any
const prop = (k: string) => a[k] ?? a[k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())]
const cols = computed<any[]>(() => (prop('columns') || []).flatMap((c: any) => c.children ? c.children : [c]).filter((c: any) => !c.type))
const isAct = (c: any) => c.title === '操作' || ['op', 'ops', 'act', 'actions'].includes(String(c.key))
const fields = computed(() => cols.value.filter(c => !isAct(c)))
const acts = computed(() => cols.value.filter(isAct))
const data = computed<any[]>(() => prop('data') || [])
const pag = computed<any>(() => prop('pagination'))
const remote = computed(() => prop('remote') !== undefined && prop('remote') !== false)
const page = ref(1)
watch(data, () => { if (!remote.value) page.value = 1 })
const size = computed(() => (pag.value && pag.value.pageSize) || 0)
const shown = computed(() => remote.value || !size.value ? data.value : data.value.slice((page.value - 1) * size.value, page.value * size.value))
const title = (c: any) => typeof c.title === 'function' ? c.title(c) : c.title
function val(c: any, r: any, i: number): VNodeChild { const v = c.render ? c.render(r, i) : r[c.key]; return v === null || v === undefined || v === '' ? '—' : (v as any) }
const key = (r: any, i: number) => { const rk = prop('rowKey'); return rk ? rk(r) : (r.id ?? i) }
function onPage(p: number) { if (remote.value) { (a['onUpdate:page'] || a.onUpdatePage)?.(p); pag.value?.onUpdatePage?.(p); pag.value?.onChange?.(p) } else page.value = p }
// FE-M4: 桌面/平板窄宽时列不再被挤成竖排：每列默认 minWidth、表头不换行；未传 scroll-x 时按列宽合计横向滚动
const MINW = 96
const dcols = computed<any[]>(() => (prop('columns') || []).map((c: any) => c.type || c.children ? c : { ...c, minWidth: c.minWidth ?? Math.min(MINW, c.width ?? MINW), className: ((c.className || '') + ' mt-nw').trim() }))
const sx = computed(() => prop('scrollX') ?? (prop('columns') || []).flatMap((c: any) => c.children || [c]).reduce((n: number, c: any) => n + (Number(c.width) || Number(c.minWidth) || MINW), 0))
const loading = computed(() => !!prop('loading'))
const Cell = (p: { c: any; r: any; i: number }) => h('div', { class: 'mt-v' }, [val(p.c, p.r, p.i) as any])
</script>
<template>
  <PageLoading v-if="!isMobile && loading && !data.length" :rows="6" />
  <n-data-table v-else-if="!isMobile" v-bind="a" :columns="dcols" :scroll-x="sx" class="mt-dt" />
  <n-spin v-else :show="loading && data.length > 0">
    <div class="mt-cards" data-mtable>
      <PageLoading v-if="loading && !data.length" :rows="4" />
      <n-empty v-else-if="!data.length" :description="emptyText" />
      <div v-for="(r, i) in shown" :key="key(r, i)" class="mt-card">
        <div v-for="c in fields" :key="String(c.key)" class="mt-row"><div class="mt-l">{{ title(c) }}</div><Cell :c="c" :r="r" :i="i" /></div>
        <div v-for="c in acts" :key="'a' + String(c.key)" class="mt-acts"><Cell :c="c" :r="r" :i="i" /></div>
      </div>
      <n-pagination v-if="pag && !loading && (remote ? (pag.itemCount || 0) > (pag.pageSize || 10) : size && data.length > size)" class="mt-pag" simple
        :page="remote ? pag.page : page" :page-size="size || 10" :item-count="remote ? pag.itemCount : data.length" @update:page="onPage" />
    </div>
  </n-spin>
</template>
<style scoped>
.mt-cards{display:flex;flex-direction:column;gap:10px}
.mt-card{background:#fff;border:1px solid #ECEEF3;border-radius:10px;padding:10px 12px;box-shadow:0 1px 2px rgba(0,0,0,.03)}
.mt-row{display:flex;gap:10px;padding:5px 0;border-bottom:1px dashed #F0F1F5;font-size:13px;align-items:flex-start}
.mt-row:last-of-type{border-bottom:0}
.mt-l{flex:0 0 88px;color:#7A7A7A;font-size:12px;line-height:20px}
.mt-v{flex:1;min-width:0;word-break:break-word;line-height:20px}
.mt-acts{padding-top:8px;margin-top:4px;border-top:1px solid #F0F1F5}
.mt-acts :deep(.n-space){flex-wrap:wrap!important}
.mt-dt :deep(th.n-data-table-th){white-space:nowrap}
.mt-dt :deep(td.mt-nw){white-space:nowrap}
.mt-pag{justify-content:center;margin-top:6px}
</style>
