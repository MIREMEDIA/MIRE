<script setup lang="ts">
import MTable from '../../components/MTable.vue'
import { h, onMounted, ref } from 'vue'
import { NCard, NButton, NSpace, NTag, NInput, NModal, NAlert, useMessage } from 'naive-ui'
import { api } from '../../api'
import { usd, wdStatus, kycLabel, fmtTime } from '../../cc'
const msg = useMessage()
const rows = ref<any[]>([]), dlg = ref<any>(null), note = ref(''), txn = ref('')
const cols = [
  { title: '#', key: 'id', width: 50 }, { title: '申请时间', key: 'createtime', width: 160, render: (r: any) => fmtTime(r.createtime) },
  { title: '创作者', key: 'creator', render: (r: any) => r.creator?.display_name },
  { title: 'KYC', key: 'kyc', width: 90, render: (r: any) => h(NTag, { size: 'small', type: kycLabel[r.creator?.kyc_status]?.[1], bordered: false }, () => kycLabel[r.creator?.kyc_status]?.[0]) },
  { title: '金额', key: 'amount_usd', width: 100, render: (r: any) => h('b', usd(r.amount_usd)) },
  { title: '收款方式', key: 'method', width: 160, render: (r: any) => `${r.method} · ${r.account}` },
  { title: '状态', key: 'status', width: 120, render: (r: any) => h(NTag, { size: 'small', type: wdStatus[r.status]?.[1], bordered: false }, () => wdStatus[r.status]?.[0]) },
  { title: '审核', key: 'note', render: (r: any) => r.reviewed_by ? `${r.reviewed_by}：${r.note || ''}${r.txn_ref ? ' · 流水 ' + r.txn_ref : ''}` : '—' },
  { title: '操作', key: 'op', width: 180, render: (r: any) => h(NSpace, { size: 4 }, () => r.status === 'pending' ? [h(NButton, { size: 'tiny', type: 'primary', onClick: () => open(r, 'approve') }, () => '批准'), h(NButton, { size: 'tiny', type: 'error', ghost: true, onClick: () => open(r, 'reject') }, () => '驳回')] : r.status === 'approved' ? [h(NButton, { size: 'tiny', type: 'success', onClick: () => open(r, 'paid') }, () => '标记已打款')] : []) },
]
function open(r: any, a: string) { dlg.value = { r, a }; note.value = ''; txn.value = '' }
async function go() { try { await api('cc.wd.act', {}, { id: dlg.value.r.id, action: dlg.value.a, note: note.value, txn_ref: txn.value }); msg.success('已处理'); dlg.value = null; load() } catch (e: any) { msg.error(e.message) } }
async function load() { rows.value = await api('cc.wd.list') }
onMounted(load)
</script>
<template>
  <n-card size="small" title="提现审核">
    <template #header-extra><span class="muted">月结 · 最低 $50 · 需 KYC 认证 · 打款在线下完成，此处仅记录状态</span></template>
    <m-table size="small" :columns="cols" :data="rows" />
  </n-card>
  <n-modal :show="!!dlg" preset="dialog" :title="dlg ? { approve: '批准提现', reject: '驳回提现', paid: '标记已打款' }[dlg.a as string] : ''" positive-text="确认" negative-text="取消" @positive-click="go" @negative-click="dlg=null" @close="dlg=null">
    <template v-if="dlg">
      <n-alert type="info" :title="`${dlg.r.creator?.display_name} · ${usd(dlg.r.amount_usd)} → ${dlg.r.method} ${dlg.r.account}`" style="margin-bottom:8px" />
      <n-input v-model:value="note" :placeholder="dlg.a==='reject' ? '驳回原因（必填）' : '备注'" />
      <n-input v-if="dlg.a==='paid'" v-model:value="txn" placeholder="打款流水号" style="margin-top:8px" />
    </template>
  </n-modal>
</template>
