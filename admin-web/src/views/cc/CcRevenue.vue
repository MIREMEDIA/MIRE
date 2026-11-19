<script setup lang="ts">
import PageLoading from '../../components/PageLoading.vue'
import { isMobile } from '../../mobile'
import MTable from '../../components/MTable.vue'
import { computed, h, onMounted, ref } from 'vue'
import { NCard, NButton, NSpace, NTag, NAlert, NGrid, NGi, NStatistic, NInput, useMessage } from 'naive-ui'
import { api } from '../../api'
import { usd, stStatus, fmtTime } from '../../cc'
const msg = useMessage()
const d = ref<any>(null), month = ref(''), gen = ref('')
const prev = () => { const t = new Date(); t.setDate(1); t.setMonth(t.getMonth() - 1); return t.toISOString().slice(0, 7) }
gen.value = prev()
const tot = computed(() => (d.value?.rows || []).reduce((a: any, r: any) => ({ coins: a.coins + r.coins, gross: a.gross + r.gross_usd, net: a.net + r.net_usd, orders: a.orders + r.orders }), { coins: 0, gross: 0, net: 0, orders: 0 }))
const cols = [
  { title: '月份', key: 'month', width: 90 }, { title: '创作者', key: 'creator_name' }, { title: '版权方 ID', key: 'copyright_id', width: 90 },
  { title: '解锁订单', key: 'orders', width: 90 }, { title: '付费用户', key: 'users', width: 90 }, { title: '消耗金币', key: 'coins', width: 100 },
  { title: '毛收入', key: 'gross_usd', width: 100, render: (r: any) => usd(r.gross_usd) },
  { title: '创作者净收益', key: 'net_usd', width: 120, render: (r: any) => h('b', { style: 'color:#FF2C48' }, usd(r.net_usd)) },
]
const sCols = [
  { title: '#', key: 'id', width: 50 }, { title: '月份', key: 'month', width: 90 }, { title: '创作者', key: 'creator_id', render: (r: any) => (d.value?.bound || []).find((c: any) => c.id === r.creator_id)?.display_name || '#' + r.creator_id },
  { title: '订单', key: 'orders', width: 70 }, { title: '金币', key: 'coins', width: 80 }, { title: '净收益', key: 'net_usd', width: 100, render: (r: any) => usd(r.net_usd) },
  { title: '状态', key: 'status', width: 90, render: (r: any) => h(NTag, { size: 'small', type: stStatus[r.status]?.[1], bordered: false }, () => stStatus[r.status]?.[0]) },
  { title: '生成/确认', key: 'by', render: (r: any) => `${r.by} ${fmtTime(r.createtime)}${r.confirmed_by ? ' → ' + r.confirmed_by : ''}` },
  { title: '操作', key: 'op', width: 150, render: (r: any) => r.status === 'draft' ? h(NSpace, { size: 4 }, () => [h(NButton, { size: 'tiny', type: 'primary', onClick: () => sact(r, 'confirm') }, () => '确认'), h(NButton, { size: 'tiny', onClick: () => sact(r, 'void') }, () => '作废')]) : '—' },
]
async function load() { try { d.value = await api('cc.rev.overview', { month: month.value }) } catch (e: any) { msg.error(e.message) } }
async function settle() { try { const r: any = await api('cc.rev.settle', {}, { month: gen.value }); msg.success(`生成 ${r.created.length} 张结算单（草稿）`); load() } catch (e: any) { msg.error(e.message) } }
async function sact(r: any, action: string) { try { await api('cc.rev.settle_act', {}, { id: r.id, action }); load() } catch (e: any) { msg.error(e.message) } }
onMounted(load)
</script>
<template>
  <PageLoading v-if="!d" />
  <template v-if="d">
    <n-alert type="info" style="margin-bottom:12px" :title="`计算口径：解锁金币 × $${d.finance.coin_usd} × (1 − 渠道费 ${d.finance.channel_fee_pct}%) × (1 − 退款 ${d.finance.refund_pct}%) × 创作者分成 ${d.finance.creator_share_pct}%`">
      数据来源：线上 vs_dramas_video_order（pay_type=1 金币解锁，只读查询）按作品 copyright_id 归属创作者；赠送金币不计入。数据库状态：{{ d.db }}
    </n-alert>
    <n-grid :cols="isMobile ? 2 : 4" :x-gap="12" :y-gap="isMobile ? 10 : 0" style="margin-bottom:12px">
      <n-gi><n-card size="small"><n-statistic label="已绑定版权方的创作者" :value="d.bound.length" /></n-card></n-gi>
      <n-gi><n-card size="small"><n-statistic label="解锁订单" :value="tot.orders" /></n-card></n-gi>
      <n-gi><n-card size="small"><n-statistic label="毛收入" :value="usd(tot.gross)" /></n-card></n-gi>
      <n-gi><n-card size="small"><n-statistic label="创作者净收益"><span style="color:#FF2C48">{{ usd(tot.net) }}</span></n-statistic></n-card></n-gi>
    </n-grid>
    <n-card size="small" title="创作者解锁收益（按月）" style="margin-bottom:12px">
      <template #header-extra><n-space><n-input v-model:value="month" clearable placeholder="月份 YYYY-MM（空=近 6 个月）" style="width:220px" @keyup.enter="load" /><n-button @click="load">查询</n-button></n-space></template>
      <m-table size="small" :columns="cols" :data="d.rows" />
    </n-card>
    <n-card size="small" title="月度结算单">
      <template #header-extra><n-space><n-input v-model:value="gen" style="width:120px" /><n-button type="primary" @click="settle">生成该月结算单</n-button></n-space></template>
      <m-table size="small" :columns="sCols" :data="d.settlements" />
    </n-card>
  </template>
</template>
