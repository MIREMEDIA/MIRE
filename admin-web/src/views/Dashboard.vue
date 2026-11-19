<script setup lang="ts">
import PageLoading from '../components/PageLoading.vue'
import { isMobile } from '../mobile'
import { onMounted, onBeforeUnmount, ref, nextTick } from 'vue'
import { NCard, NGrid, NGi, NSpin, NAlert, NButton, NSelect } from 'naive-ui'
// FE-M4: 按需引入 echarts（原 import * 打进全量 ~1.1MB），只注册首页用到的柱/折线 + 坐标/提示/图例
import * as echarts from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
echarts.use([BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent, CanvasRenderer])
import { api } from '../api'
const cur = ref(''), curOpts = ref<any[]>([])
const rev = (o: any) => o?.revenue?.[cur.value] ?? 0
const d = ref<any>(null), err = ref(''), loading = ref(true), el = ref<HTMLElement>()
let chart: echarts.ECharts | null = null
const n = (v: any, money = false) => v === null || v === undefined ? '—' : money ? Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : Number(v).toLocaleString('en-US')
async function load() {
  loading.value = true; err.value = ''
  try { d.value = await api('dashboard'); const cs = Object.keys(d.value.trend?.revenue || {}); const all = new Set([...cs, ...Object.keys(d.value.vip_orders?.['7d']?.revenue || {}), ...Object.keys(d.value.points_orders?.['7d']?.revenue || {})]); curOpts.value = [...all].map(c => ({ label: c, value: c })); if (!all.has(cur.value)) cur.value = cs[0] || [...all][0] || ''; await nextTick(); draw() } catch (e: any) { err.value = e.message } finally { loading.value = false }
}
function draw() {
  if (!el.value || !d.value?.trend) return
  chart = chart || echarts.init(el.value)
  const t = d.value.trend, r = t.revenue?.[cur.value] || { vip: [], points: [] }
  chart.setOption({
    color: ['#D8DCE6', '#FF2C48', '#101010'], tooltip: { trigger: 'axis' }, legend: { data: ['新注册', 'VIP 实收', '积分实收'], right: 10 },
    grid: { left: 50, right: 60, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: t.days.map((x: string) => x.slice(5)) },
    yAxis: [{ type: 'value', name: '人' }, { type: 'value', name: cur.value }],
    series: [
      { name: '新注册', type: 'bar', data: t.reg, barMaxWidth: 18, itemStyle: { borderRadius: [4, 4, 0, 0] } },
      { name: 'VIP 实收', type: 'line', yAxisIndex: 1, smooth: true, data: r.vip, areaStyle: { opacity: .06 } },
      { name: '积分实收', type: 'line', yAxisIndex: 1, smooth: true, data: r.points },
    ],
  })
}
const onResize = () => chart?.resize()
onMounted(() => { load(); window.addEventListener('resize', onResize) })
onBeforeUnmount(() => { window.removeEventListener('resize', onResize); chart?.dispose() })
</script>
<template>
  <n-spin :show="loading">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
      <div><h2 style="margin:0">运营概览</h2><div class="muted">数据来自线上库只读查询 · 时区 {{ d?.tz }} · 生成于 {{ d?.generated_at }}</div></div>
      <div style="display:flex;gap:8px;align-items:center"><span class="muted">币种</span><n-select v-model:value="cur" size="small" style="width:100px" :options="curOpts" @update:value="()=>nextTick(draw)" /><n-button size="small" @click="load">刷新</n-button></div>
    </div>
    <n-alert v-if="err" type="error" style="margin-bottom:12px">{{ err }}</n-alert>
    <PageLoading v-if="!d && !err" />
    <n-grid :cols="isMobile ? 1 : 4" :x-gap="14" :y-gap="14" v-if="d">
      <n-gi><n-card size="small"><div class="muted">会员总数</div><div class="kpi-num">{{ n(d.members?.total) }}</div><div class="muted">今日新增 <b style="color:#FF2C48">+{{ n(d.members?.reg_today) }}</b> · 游客 {{ n(d.members?.guests) }}</div></n-card></n-gi>
      <n-gi><n-card size="small"><div class="muted">今日登录</div><div class="kpi-num">{{ n(d.members?.login_today) }}</div><div class="muted">7日活跃 {{ n(d.members?.active_7d) }} · 30日 {{ n(d.members?.active_30d) }} · 有效VIP {{ n(d.members?.vip_active) }}</div></n-card></n-gi>
      <n-gi><n-card size="small"><div class="muted">今日 VIP 实收（{{ cur }}）</div><div class="kpi-num">{{ n(rev(d.vip_orders?.today), true) }}</div><div class="muted">订单 {{ n(d.vip_orders?.today?.orders) }} · 已付 {{ n(d.vip_orders?.today?.paid) }}</div></n-card></n-gi>
      <n-gi><n-card size="small"><div class="muted">今日积分实收（{{ cur }}）</div><div class="kpi-num">{{ n(rev(d.points_orders?.today), true) }}</div><div class="muted">订单 {{ n(d.points_orders?.today?.orders) }} · 已付 {{ n(d.points_orders?.today?.paid) }}</div></n-card></n-gi>
      <n-gi :span="isMobile ? 1 : 3"><n-card size="small" :title="'近 14 天趋势（实收 ' + cur + '）'"><div ref="el" style="height:320px"></div></n-card></n-gi>
      <n-gi><n-card size="small" title="近 7 天">
        <div class="row"><span>VIP 订单 / 已付</span><b>{{ n(d.vip_orders?.['7d']?.orders) }} / {{ n(d.vip_orders?.['7d']?.paid) }}</b></div>
        <div class="row"><span>VIP 支付率</span><b>{{ d.vip_orders?.['7d']?.orders ? (d.vip_orders['7d'].paid / d.vip_orders['7d'].orders * 100).toFixed(1) + '%' : '—' }}</b></div>
        <div class="row" v-for="(v,c) in d.vip_orders?.['7d']?.revenue" :key="'v'+c"><span>VIP 实收 {{ c }}</span><b style="color:#FF2C48">{{ n(v, true) }}</b></div>
        <div class="row"><span>积分订单 / 已付</span><b>{{ n(d.points_orders?.['7d']?.orders) }} / {{ n(d.points_orders?.['7d']?.paid) }}</b></div>
        <div class="row" v-for="(v,c) in d.points_orders?.['7d']?.revenue" :key="'p'+c"><span>积分实收 {{ c }}</span><b style="color:#FF2C48">{{ n(v, true) }}</b></div>
        <div class="row"><span>今日解锁剧集</span><b>{{ n(d.unlock_today?.orders) }}</b></div>
        <div class="row"><span>今日消耗积分 / 看广告解锁</span><b>{{ n(d.unlock_today?.points) }} / {{ n(d.unlock_today?.by_ad) }}</b></div>
        <div class="row"><span>短剧（上架/总数）</span><b>{{ n(d.dramas?.up) }} / {{ n(d.dramas?.total) }}</b></div>
      </n-card></n-gi>
    </n-grid>
  </n-spin>
</template>
<style scoped>.row{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px dashed #eee;font-size:13px}</style>
