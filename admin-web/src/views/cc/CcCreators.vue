<script setup lang="ts">
import { isMobile } from '../../mobile'
import MTable from '../../components/MTable.vue'
import { h, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { NCard, NSelect, NInput, NInputNumber, NButton, NSpace, NTag, NDrawer, NDrawerContent, NDescriptions, NDescriptionsItem, NTabs, NTabPane, NTimeline, NTimelineItem, NPopconfirm, useMessage } from 'naive-ui'
import { api } from '../../api'
import { can, signLabel, kycLabel, creatorStatus, levelLabel, pubStatus, fmtTime, usd, wdStatus, stStatus } from '../../cc'
const router = useRouter(), msg = useMessage()
const f = reactive({ q: '', status: null, sign: null, kyc: null })
const rows = ref<any[]>([]), loading = ref(false)
const show = ref(false), d = ref<any>(null), note = ref(''), banWhy = ref(''), cr = ref<number | null>(null)
const tag = (m: any) => (m ? h(NTag, { size: 'small', type: m[1], bordered: false }, () => m[0]) : '—')
const cols: any[] = [
  { title: 'ID', key: 'id', width: 60 },
  { title: '创作者', key: 'display_name', minWidth: 140, render: (r: any) => h('a', { class: 'lnk', onClick: () => open(r.id) }, r.display_name) },
  { title: '等级', key: 'level', width: 100, render: (r: any) => levelLabel[r.level] || r.level },
  { title: '账号状态', key: 'status', width: 90, render: (r: any) => tag(creatorStatus[r.status]) },
  { title: '签约', key: 'sign_status', width: 90, render: (r: any) => tag(signLabel[r.sign_status]) },
  { title: 'KYC', key: 'kyc_status', width: 90, render: (r: any) => tag(kycLabel[r.kyc_status]) },
  { title: '作品/提交/通过', key: 'projects', width: 130, render: (r: any) => `${r.projects} / ${r.submitted} / ${r.approved}` },
  { title: 'Spark 余额', key: 'credits', width: 100 },
  { title: '版权方 ID', key: 'copyright_id', width: 90, render: (r: any) => r.copyright_id || '—' },
  { title: '邀请码', key: 'invite_code', width: 150, render: (r: any) => r.invite_code || (r.user_type === 'demo' ? '演示账号' : '—') },
  { title: '加入时间', key: 'createtime', width: 160, render: (r: any) => fmtTime(r.createtime) },
  { title: '操作', key: 'op', width: 80, fixed: 'right', render: (r: any) => h(NButton, { size: 'small', onClick: () => open(r.id) }, () => '详情') },
]
async function load() { loading.value = true; try { const l: any[] = await api('cc.creator.list'); rows.value = l.filter(r => (!f.q || r.display_name.includes(f.q) || (r.invite_code || '').includes(f.q)) && (!f.status || r.status === f.status) && (!f.sign || r.sign_status === f.sign) && (!f.kyc || r.kyc_status === f.kyc)) } catch (e: any) { msg.error(e.message) } finally { loading.value = false } }
async function open(id: number) { d.value = await api('cc.creator.get', { id }); cr.value = d.value.creator.copyright_id || null; show.value = true }
async function upd(action: string, value: any = null, extra: any = {}) {
  if (action === 'kyc') { const reason = window.prompt(value === 'rejected' ? '请填写驳回原因 / Rejection reason (required)' : '审核备注（可选）/ Note (optional)'); if (reason === null || (value === 'rejected' && !reason.trim())) return; if (reason.trim()) extra = { ...extra, reason } }
  try { await api('cc.creator.update', {}, { id: d.value.creator.id, action, value, ...extra }); msg.success('已保存'); note.value = ''; banWhy.value = ''; await open(d.value.creator.id); load() } catch (e: any) { msg.error(e.message) }
}
const opts = (m: Record<string, any>) => Object.entries(m).map(([v, l]) => ({ value: v, label: Array.isArray(l) ? l[0] : l }))
onMounted(load)
</script>
<template>
  <n-card size="small" title="创作者管理">
    <template #header-extra><span class="muted">受邀创作者 · 签约 / KYC / 封禁 / 备注，数据来自 Studio 存储</span></template>
    <n-space style="margin-bottom:12px" :class="{ 'm-filters': isMobile }">
      <n-input v-model:value="f.q" clearable placeholder="昵称 / 邀请码" style="width:200px" @keyup.enter="load" />
      <n-select v-model:value="f.status" clearable placeholder="账号状态" style="width:120px" :options="opts(creatorStatus)" />
      <n-select v-model:value="f.sign" clearable placeholder="签约状态" style="width:120px" :options="opts(signLabel)" />
      <n-select v-model:value="f.kyc" clearable placeholder="KYC" style="width:120px" :options="opts(kycLabel)" />
      <n-button type="primary" @click="load">查询</n-button>
    </n-space>
    <m-table :columns="cols" :data="rows" :loading="loading" size="small" :scroll-x="1400" />
  </n-card>
  <n-drawer v-model:show="show" :width="isMobile ? '100%' : 860">
    <n-drawer-content v-if="d" :title="`创作者 · ${d.creator.display_name}`" closable>
      <n-descriptions bordered size="small" :column="isMobile ? 1 : 3" label-placement="left">
        <n-descriptions-item label="ID">{{ d.creator.id }}（Studio 用户 #{{ d.creator.user_id }}）</n-descriptions-item>
        <n-descriptions-item label="账号"><n-tag size="small" :type="creatorStatus[d.creator.status]?.[1]" :bordered="false">{{ creatorStatus[d.creator.status]?.[0] }}</n-tag></n-descriptions-item>
        <n-descriptions-item label="Spark 余额">{{ d.credits }}</n-descriptions-item>
        <n-descriptions-item label="等级"><n-select size="small" :value="d.creator.level" :options="opts(levelLabel)" style="width:130px" @update:value="(v:any)=>upd('level',v)" /></n-descriptions-item>
        <n-descriptions-item label="签约"><n-select size="small" :value="d.creator.sign_status" :options="opts(signLabel)" style="width:110px" @update:value="(v:any)=>upd('sign',v)" /></n-descriptions-item>
        <n-descriptions-item label="KYC"><n-select v-if="can('cc.kyc')" size="small" :value="d.creator.kyc_status" :options="opts(kycLabel)" style="width:110px" @update:value="(v:any)=>upd('kyc',v)" /><span v-else>{{kycLabel[d.creator.kyc_status]?.[0] || d.creator.kyc_status}}</span> <router-link v-if="can('cc.kyc')" to="/p/cc_kyc">材料审核</router-link></n-descriptions-item>
        <n-descriptions-item label="版权方 ID" :span="2"><n-space size="small"><n-input-number v-model:value="cr" size="small" :min="0" style="width:120px" /><n-button size="small" @click="upd('copyright', cr||0)">绑定</n-button>
          <span v-if="d.copyright" class="muted">vs_dramas_copyright：{{ d.copyright.name }} · 分成 {{ d.copyright.ratio }}</span><span v-else-if="d.creator.copyright_id" class="muted" style="color:#d03050">线上库未找到该版权方</span></n-space></n-descriptions-item>
        <n-descriptions-item label="邀请码">{{ d.creator.invite_code || '—' }}</n-descriptions-item>
        <n-descriptions-item v-if="d.creator.status==='banned'" label="封禁原因" :span="3">{{ d.creator.ban_reason }} · {{ fmtTime(d.creator.banned_at) }}</n-descriptions-item>
      </n-descriptions>
      <n-space style="margin:12px 0">
        <template v-if="d.creator.status!=='banned'"><n-input v-model:value="banWhy" size="small" placeholder="封禁原因" style="width:260px" /><n-popconfirm @positive-click="upd('ban',null,{reason:banWhy})"><template #trigger><n-button size="small" type="error">封禁（立即下线所有会话）</n-button></template>确认封禁该创作者？</n-popconfirm></template>
        <n-button v-else size="small" type="success" @click="upd('unban')">解除封禁</n-button>
      </n-space>
      <n-tabs type="line">
        <n-tab-pane name="w" :tab="`作品 (${d.works.length})`">
          <m-table size="small" :data="d.works" :columns="[{title:'项目',key:'title',render:(r:any)=>h('span',[r.title,h('span',{class:'muted'},' #'+r.project_id)])},{title:'题材',key:'genre'},{title:'集数',key:'episodes'},{title:'项目状态',key:'status'},{title:'最新提交',key:'publish',render:(r:any)=>r.publish?h('a',{class:'lnk',onClick:()=>router.push({path:'/p/cc_review',query:{id:r.publish.id}})},(pubStatus[r.publish.status]?.[0]||r.publish.status)+' · 风险 '+r.publish.score):'未提交'},{title:'版本数',key:'versions'},{title:'更新',key:'updatetime',render:(r:any)=>fmtTime(r.updatetime)}]" />
        </n-tab-pane>
        <n-tab-pane name="n" :tab="`备注 (${(d.creator.notes||[]).length})`">
          <n-timeline><n-timeline-item v-for="(n,i) in d.creator.notes||[]" :key="i" :title="n.by" :time="fmtTime(n.at)" :content="n.text" /></n-timeline>
          <n-space><n-input v-model:value="note" placeholder="内部备注（创作者不可见）" style="width:500px" /><n-button type="primary" @click="upd('note',null,{text:note})">添加</n-button></n-space>
        </n-tab-pane>
        <n-tab-pane name="m" tab="收益 & 提现">
          <m-table size="small" :data="d.settlements" :columns="[{title:'月份',key:'month'},{title:'订单',key:'orders'},{title:'金币',key:'coins'},{title:'净收益',key:'net_usd',render:(r:any)=>usd(r.net_usd)},{title:'状态',key:'status',render:(r:any)=>stStatus[r.status]?.[0]}]" />
          <m-table size="small" style="margin-top:10px" :data="d.withdrawals" :columns="[{title:'申请时间',key:'createtime',render:(r:any)=>fmtTime(r.createtime)},{title:'金额',key:'amount_usd',render:(r:any)=>usd(r.amount_usd)},{title:'方式',key:'method'},{title:'状态',key:'status',render:(r:any)=>wdStatus[r.status]?.[0]}]" />
        </n-tab-pane>
        <n-tab-pane name="c" tab="Spark 流水">
          <m-table size="small" :data="d.credit_logs" :columns="[{title:'时间',key:'createtime',render:(r:any)=>fmtTime(r.createtime)},{title:'变动',key:'change'},{title:'类型',key:'type'},{title:'说明',key:'memo'}]" />
        </n-tab-pane>
        <n-tab-pane name="a" tab="审计">
          <m-table size="small" :data="d.audit" :columns="[{title:'时间',key:'createtime',width:160,render:(r:any)=>fmtTime(r.createtime)},{title:'操作人',key:'actor'},{title:'动作',key:'action'},{title:'对象',key:'target'}]" />
        </n-tab-pane>
      </n-tabs>
    </n-drawer-content>
  </n-drawer>
</template>
<style scoped>:deep(.lnk){color:#FF2C48;cursor:pointer;font-weight:600}</style>
