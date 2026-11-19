<script setup lang="ts">
import PageLoading from '../../components/PageLoading.vue'
import { isMobile } from '../../mobile'
import MTable from '../../components/MTable.vue'
import { h, onMounted, ref } from 'vue'
import { NCard, NButton, NSpace, NInput, NInputNumber, NSelect, NGrid, NGi, NStatistic, NTabs, NTabPane, NDynamicInput, NSwitch, useMessage } from 'naive-ui'
import { api } from '../../api'
import { fmtTime } from '../../cc'
const msg = useMessage()
const d = ref<any>(null), cfg = ref<any>(null), adj = ref<any>({ user_id: null, change: 100, memo: '' }), filt = ref<number | null>(null)
const typeName: Record<string, string> = { trial: '新人试用', grant: '人工发放', deduct: '人工扣减', spend: '生成消耗', signed_bonus: '签约奖励', refund: '失败返还' }
const cols = [
  { title: '时间', key: 'createtime', width: 160, render: (r: any) => fmtTime(r.createtime) }, { title: '用户', key: 'user_name', width: 130 },
  { title: '变动', key: 'change', width: 90, render: (r: any) => h('b', { style: `color:${r.change > 0 ? '#18A058' : '#FF2C48'}` }, (r.change > 0 ? '+' : '') + r.change) },
  { title: '余额', key: 'balance_after', width: 90 }, { title: '类型', key: 'type', width: 100, render: (r: any) => typeName[r.type] || r.type },
  { title: '说明', key: 'memo' }, { title: '操作人', key: 'by', width: 100 },
]
async function load() { d.value = await api('cc.credit.overview', { user_id: filt.value || 0 }); if (!cfg.value) cfg.value = JSON.parse(JSON.stringify(d.value.config)) }
async function doAdj() { try { await api('cc.credit.adjust', {}, adj.value); msg.success('已入账'); adj.value.memo = ''; load() } catch (e: any) { msg.error(e.message) } }
async function save() { try { cfg.value = await api('cc.cfg.save', {}, { key: 'credits', value: cfg.value }); msg.success('积分配置已保存（Studio 实时读取）') } catch (e: any) { msg.error(e.message) } }
onMounted(load)
</script>
<template>
  <PageLoading v-if="!d" />
  <template v-if="d">
    <n-grid :cols="isMobile ? 2 : 4" :x-gap="12" :y-gap="isMobile ? 10 : 0" style="margin-bottom:12px">
      <n-gi><n-card size="small"><n-statistic label="累计发放 Spark" :value="d.summary.granted" /></n-card></n-gi>
      <n-gi><n-card size="small"><n-statistic label="累计消耗 Spark" :value="d.summary.spent" /></n-card></n-gi>
      <n-gi><n-card size="small"><n-statistic label="新人试用额度" :value="d.config.trial" /></n-card></n-gi>
      <n-gi><n-card size="small"><n-statistic label="换算" :value="`1 Spark ≈ $${d.config.spark_usd}`" /></n-card></n-gi>
    </n-grid>
    <n-card size="small">
      <n-tabs type="line">
        <n-tab-pane name="log" tab="积分流水">
          <n-space style="margin-bottom:10px" align="center">
            <n-select v-model:value="filt" clearable placeholder="按用户筛选" style="width:180px" :options="d.users.map((u:any)=>({label:`${u.name}（余额 ${u.balance}）`,value:u.user_id}))" @update:value="load" />
            <span style="margin-left:24px">人工调整：</span>
            <n-select v-model:value="adj.user_id" placeholder="选择创作者" style="width:180px" :options="d.users.map((u:any)=>({label:`${u.name}（${u.balance}）`,value:u.user_id}))" />
            <n-input-number v-model:value="adj.change" style="width:120px" placeholder="正数发放/负数扣减" />
            <n-input v-model:value="adj.memo" placeholder="原因（必填，写入审计）" style="width:220px" />
            <n-button type="primary" @click="doAdj">提交</n-button>
          </n-space>
          <m-table size="small" :columns="cols" :data="d.logs" :pagination="{ pageSize: 20 }" />
        </n-tab-pane>
        <n-tab-pane name="cfg" tab="套餐 / 会员 / 试用配置">
          <template v-if="cfg">
            <n-space align="center" style="margin-bottom:12px">
              <span>新人试用</span><n-input-number v-model:value="cfg.trial" :min="0" style="width:110px" />
              <span>签约奖励</span><n-input-number v-model:value="cfg.signed_bonus" :min="0" style="width:110px" />
              <span>1 Spark = $</span><n-input-number v-model:value="cfg.spark_usd" :step="0.001" style="width:110px" />
            </n-space>
            <div class="muted" style="margin-bottom:6px">充值套餐</div>
            <n-dynamic-input v-model:value="cfg.packages" :on-create="()=>({id:'p'+Date.now(),name:'',credits:1000,price_usd:9.99,bonus:0,status:'on'})">
              <template #default="{ value }"><n-space align="center"><n-input v-model:value="value.name" placeholder="名称" style="width:140px" /><n-input-number v-model:value="value.credits" style="width:110px" /><span>Spark ·$</span><n-input-number v-model:value="value.price_usd" :step="0.01" style="width:100px" /><span>赠</span><n-input-number v-model:value="value.bonus" style="width:90px" /><n-switch :value="value.status==='on'" @update:value="(v:boolean)=>value.status=v?'on':'off'" /></n-space></template>
            </n-dynamic-input>
            <div class="muted" style="margin:12px 0 6px">会员</div>
            <n-dynamic-input v-model:value="cfg.memberships" :on-create="()=>({id:'m'+Date.now(),name:'',monthly_price:19.9,monthly_credits:2000,concurrency:1,perks:''})">
              <template #default="{ value }"><n-space align="center"><n-input v-model:value="value.name" placeholder="名称" style="width:140px" /><span>$/月</span><n-input-number v-model:value="value.monthly_price" :step="0.1" style="width:100px" /><span>每月 Spark</span><n-input-number v-model:value="value.monthly_credits" style="width:110px" /><span>并发</span><n-input-number v-model:value="value.concurrency" :min="1" style="width:80px" /><n-input v-model:value="value.perks" placeholder="权益" style="width:160px" /></n-space></template>
            </n-dynamic-input>
            <n-button type="primary" style="margin-top:12px" @click="save">保存配置</n-button>
          </template>
        </n-tab-pane>
      </n-tabs>
    </n-card>
  </template>
</template>
