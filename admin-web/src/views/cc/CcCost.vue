<script setup lang="ts">
import PageLoading from '../../components/PageLoading.vue'
import { isMobile } from '../../mobile'
import MTable from '../../components/MTable.vue'
import { h, onMounted, ref } from 'vue'
import { NCard, NGrid, NGi, NStatistic, NSelect, NAlert, NTag } from 'naive-ui'
import { api } from '../../api'
import { fmtTime } from '../../cc'
const d = ref<any>(null), days = ref(30)
const est = (r: any) => { const u = d.value?.unit || {}; return r.calls * ((r.type || r.label || '').startsWith('LLM') ? u.llm || 0 : u.image || 0) }
const money = (v: number) => '$' + v.toFixed(4)
async function load() { d.value = await api('cc.cost', { days: days.value }) }
const bar = (r: any, max: number) => h('div', { style: 'display:flex;align-items:center;gap:8px' }, [h('div', { style: `height:10px;border-radius:5px;background:#FF2C48;width:${Math.max(2, (r.calls / max) * 240)}px` }), String(r.calls)])
onMounted(load)
</script>
<template>
  <PageLoading v-if="!d" />
  <template v-if="d">
    <n-alert v-if="d.total.mock === d.total.calls" type="warning" style="margin-bottom:12px" title="当前全部为离线 Mock 调用（未配置模型 Key），实际成本 $0；“按实价估算”列按「模型与模板」中各档单价折算，供上线前预算参考。" />
    <n-grid :cols="isMobile ? 2 : 5" :x-gap="12" :y-gap="isMobile ? 10 : 0" style="margin-bottom:12px">
      <n-gi><n-card size="small"><n-statistic :label="`近 ${d.days} 天调用`" :value="d.total.calls" /></n-card></n-gi>
      <n-gi><n-card size="small"><n-statistic label="实际成本" :value="'$' + d.total.usd.toFixed(2)" /></n-card></n-gi>
      <n-gi><n-card size="small"><n-statistic label="按实价估算"><span style="color:#FF2C48">{{ money(d.by_type.reduce((a:number,r:any)=>a+est(r),0)) }}</span></n-statistic></n-card></n-gi>
      <n-gi><n-card size="small"><n-statistic label="失败" :value="d.total.failed" /></n-card></n-gi>
      <n-gi><n-card size="small"><n-statistic label="Mock 调用" :value="d.total.mock" /></n-card></n-gi>
    </n-grid>
    <n-grid :cols="isMobile ? 1 : 2" :x-gap="12" :y-gap="isMobile ? 10 : 0" style="margin-bottom:12px">
      <n-gi><n-card size="small" title="按任务类型">
        <template #header-extra><n-select v-model:value="days" size="small" style="width:110px" :options="[7,30,90].map(v=>({label:'近 '+v+' 天',value:v}))" @update:value="load" /></template>
        <m-table size="small" :data="d.by_type" :columns="[{title:'类型',key:'type'},{title:'调用',key:'calls',render:(r:any)=>bar(r,Math.max(...d.by_type.map((x:any)=>x.calls)))},{title:'实际',key:'usd',render:(r:any)=>money(r.usd)},{title:'按实价估算',key:'e',render:(r:any)=>money(est(r))},{title:'失败',key:'failed'}]" />
      </n-card></n-gi>
      <n-gi><n-card size="small" title="按创作者 / 按天">
        <m-table size="small" :data="d.by_user" :columns="[{title:'创作者',key:'user'},{title:'调用',key:'calls'},{title:'实际',key:'usd',render:(r:any)=>money(r.usd)},{title:'失败',key:'failed'}]" />
        <m-table size="small" style="margin-top:8px" :data="d.by_day" :columns="[{title:'日期',key:'day'},{title:'调用',key:'calls'},{title:'实际',key:'usd',render:(r:any)=>money(r.usd)},{title:'失败',key:'failed'}]" />
      </n-card></n-gi>
    </n-grid>
    <n-card size="small" title="最近任务（jobs 表）">
      <m-table size="small" :data="d.recent" :pagination="{pageSize:15}" :columns="[{title:'#',key:'id',width:60},{title:'时间',key:'time',width:160,render:(r:any)=>fmtTime(r.time)},{title:'创作者',key:'user'},{title:'任务',key:'label'},{title:'模式',key:'mode',render:(r:any)=>h(NTag,{size:'small',bordered:false,type:r.mode==='real'?'error':'default'},()=>r.mode)},{title:'调用',key:'calls'},{title:'耗时',key:'ms',render:(r:any)=>r.ms?r.ms+' ms':'—'},{title:'成本',key:'usd',render:(r:any)=>money(r.usd)},{title:'状态',key:'status'}]" />
    </n-card>
  </template>
</template>
