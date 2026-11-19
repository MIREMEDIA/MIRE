<script setup lang="ts">
// B8-6 提现审核（0 待审核 → 1 处理中 → 2 已处理；0/1 → -1 拒绝并退回余额）+ 用户收款账户（脱敏）+ 提现规则（config.withdraw）
import { h, onMounted, ref } from 'vue'
import { NButton, NCard, NInput, NInputNumber, NSelect, NTabs, NTabPane, NAlert, NTag, NModal, NCheckbox, NCheckboxGroup, useMessage } from 'naive-ui'
import { api } from '../../api'
import { t, fmtTime } from '../../b8i18n'
import MTable from '../../components/MTable.vue'
import B8Bar from './B8Bar.vue'
import { dbw, loadDbw } from '../../ro'
loadDbw('b8')
import { usePaged } from './usePaged'
import './b8.css'
const props = defineProps<{ page: any; mode: string }>()
const msg = useMessage()
const W = usePaged('b8.wd.list', { status: '0', user_id: '', apply_sn: '' })
const B = usePaged('b8.bank.list', { user_id: '', type: '' })
const tab = ref(props.mode === 'wd_rule' ? 'rule' : 'wd')
const ST: Record<string, any> = { '-1': 'error', '0': 'warning', '1': 'info', '2': 'success' }
const mt = (m: string) => t('b8.wd.m_' + m) === 'b8.wd.m_' + m ? m : t('b8.wd.m_' + m)
const stOpts = () => [{ label: t('b8.all'), value: 'all' }, ...['0', '1', '2', '-1'].map(s => ({ label: t('b8.wd.s' + s), value: s }))]
// action modal
const dlg = ref<any>(null); const busy = ref(false)
function open(kind: 'approve' | 'paid' | 'reject', r: any) { dlg.value = { kind, r, text: '' } }
async function doAct() {
  const { kind, r, text } = dlg.value
  if (kind === 'reject' && !text.trim()) { msg.error(t('b8.wd.reason')); return }
  busy.value = true
  try {
    const res = await api('b8.wd.' + kind, {}, kind === 'reject' ? { id: r.id, reason: text } : { id: r.id, remark: text })
    msg.success(kind === 'reject' ? t('b8.wd.refunded', { m: res.refund }) : t('b8.saved')); dlg.value = null; await W.load()
  } catch (e: any) { msg.error(e.message) } finally { busy.value = false }
}
const wdCols = () => [{ title: t('b8.id'), key: 'id', width: 60 }, { title: t('b8.wd.sn'), key: 'apply_sn' },
  { title: t('b8.user_id'), key: 'user_id', render: (r: any) => `#${r.user_id} ${r.nickname || ''}` },
  { title: t('b8.wd.method'), key: 'apply_type', render: (r: any) => mt(r.apply_type) },
  { title: t('b8.wd.account'), key: 'account', render: (r: any) => [r.real_name, r.bank_name, r.account].filter(Boolean).join(' · ') },
  { title: t('b8.wd.money'), key: 'money' }, { title: t('b8.wd.fee'), key: 'charge_money' }, { title: t('b8.wd.pay_money'), key: 'pay_money', render: (r: any) => `${r.pay_money} ${r.currency || ''}` },
  { title: t('b8.status'), key: 'status', render: (r: any) => h(NTag, { size: 'small', type: ST[String(r.status)] }, () => t('b8.wd.s' + r.status)) },
  { title: t('b8.time'), key: 'createtime', render: (r: any) => fmtTime(r.createtime) },
  { title: t('b8.wd.log'), key: 'log', render: (r: any) => r.log.length ? h('div', { style: 'font-size:12px' }, r.log.slice(-3).map((l: any) => h('div', `${fmtTime(l.time)} ${l.log}`))) : '' },
  { title: t('b8.op'), key: 'op', render: (r: any) => h('div', { class: 'b8-row' }, [
      r.status === 0 ? h(NButton, { size: 'small', type: 'primary', disabled: !W.d.value?.writable, 'data-wd-approve': r.id, onClick: () => open('approve', r) }, () => t('b8.wd.approve')) : null,
      r.status === 1 ? h(NButton, { size: 'small', type: 'success', disabled: !W.d.value?.writable, 'data-wd-paid': r.id, onClick: () => open('paid', r) }, () => t('b8.wd.paid')) : null,
      r.status === 0 || r.status === 1 ? h(NButton, { size: 'small', type: 'error', ghost: true, disabled: !W.d.value?.writable, 'data-wd-reject': r.id, onClick: () => open('reject', r) }, () => t('b8.wd.reject')) : null]) }]
const bankCols = () => [{ title: t('b8.id'), key: 'id' }, { title: t('b8.user_id'), key: 'user_id', render: (r: any) => `#${r.user_id} ${r.nickname || ''}` },
  { title: t('b8.type'), key: 'type', render: (r: any) => mt(r.type) }, { title: t('b8.wd.real_name'), key: 'real_name' }, { title: t('b8.wd.bank_name'), key: 'bank_name' },
  { title: t('b8.wd.card_no'), key: 'card_no' }, { title: t('b8.wd.qr'), key: 'has_image', render: (r: any) => r.has_image ? t('b8.yes') : '' }, { title: t('b8.time'), key: 'createtime', render: (r: any) => fmtTime(r.createtime) }]
// rule
const rule = ref<any>(null); const rf = ref<any>(null); const rerr = ref('')
async function loadRule() {
  rerr.value = ''
  try { rule.value = await api('b8.wd.rule'); const x = rule.value.rule; rf.value = x ? { min: +x.min || 0, max: +x.max || 0, service_fee: +x.service_fee || 0, perday_amount: +x.perday_amount || 0, perday_num: +x.perday_num || 0, methods: [...(x.methods || [])] } : null }
  catch (e: any) { rerr.value = e.message }
}
async function saveRule() { busy.value = true; try { await api('b8.wd.rule.save', {}, rf.value); msg.success(t('b8.saved')); await loadRule() } catch (e: any) { msg.error(e.message) } finally { busy.value = false } }
function onTab(v: string) { tab.value = v; if (v === 'wd' && !W.d.value) W.load(); if (v === 'bank' && !B.d.value) B.load(); if (v === 'rule' && !rule.value) loadRule() }
onMounted(() => onTab(tab.value))
</script>
<template>
  <div class="b8" data-b8="withdraw">
    <B8Bar :title="tab === 'rule' ? t('b8.wd.rule') : t('b8.wd.title')" :writable="tab === 'rule' ? rule?.writable : W.d.value?.writable" :db="dbw.b8" />
    <n-tabs :value="tab" type="line" @update:value="onTab">
      <n-tab-pane name="wd" :tab="t('b8.wd.title')">
        <div class="b8-f">
          <n-select v-model:value="W.f.value.status" :options="stOpts()" @update:value="W.search" />
          <n-input v-model:value="W.f.value.user_id" :placeholder="t('b8.user_id')" clearable @keyup.enter="W.search" />
          <n-input v-model:value="W.f.value.apply_sn" :placeholder="t('b8.wd.sn')" clearable @keyup.enter="W.search" />
          <n-button type="primary" @click="W.search">{{ t('b8.search') }}</n-button>
        </div>
        <n-alert v-if="W.err.value" type="error">{{ W.err.value }}</n-alert>
        <p v-if="W.d.value" class="muted" style="margin:6px 0" data-b8="wd-counts">{{ t('b8.total', { n: W.loading.value ? '—' : W.d.value.total }) }} · <span v-for="s in ['0', '1', '2', '-1']" :key="s" style="margin-right:8px">{{ t('b8.wd.s' + s) }} {{ W.d.value.counts[s] || 0 }}</span></p>
        <MTable :columns="wdCols()" :data="W.d.value?.list || []" remote size="small" :loading="W.loading.value || !W.d.value" :pagination="W.pag()" :scroll-x="1300" />
      </n-tab-pane>
      <n-tab-pane name="bank" :tab="t('b8.wd.banks')">
        <div class="b8-f">
          <n-input v-model:value="B.f.value.user_id" :placeholder="t('b8.user_id')" clearable @keyup.enter="B.search" />
          <n-select v-model:value="B.f.value.type" :options="[{ label: t('b8.all'), value: '' }, ...['bank', 'alipay', 'wechat'].map(m => ({ label: mt(m), value: m }))]" @update:value="B.search" />
          <n-button type="primary" @click="B.search">{{ t('b8.search') }}</n-button>
        </div>
        <n-alert v-if="B.err.value" type="error">{{ B.err.value }}</n-alert>
        <MTable :columns="bankCols()" :data="B.d.value?.list || []" remote size="small" :loading="B.loading.value || !B.d.value" :pagination="B.pag()" />
      </n-tab-pane>
      <n-tab-pane name="rule" :tab="t('b8.wd.rule')">
        <n-alert v-if="rerr" type="error">{{ rerr }}</n-alert>
        <n-alert v-if="rule && !rf" type="warning">{{ t('b8.wd.rule_missing') }}</n-alert>
        <n-card v-if="rf" size="small" data-b8="wd-rule">
          <div class="b8-grid">
            <label>{{ t('b8.wd.min') }}<n-input-number v-model:value="rf.min" :min="0" size="small" /></label>
            <label>{{ t('b8.wd.max') }}<n-input-number v-model:value="rf.max" :min="0" size="small" /></label>
            <label>{{ t('b8.wd.service_fee') }}<n-input-number v-model:value="rf.service_fee" :min="0" :max="1" :step="0.01" size="small" /></label>
            <label>{{ t('b8.wd.perday_amount') }}<n-input-number v-model:value="rf.perday_amount" :min="0" size="small" /></label>
            <label>{{ t('b8.wd.perday_num') }}<n-input-number v-model:value="rf.perday_num" :min="0" :max="1000" size="small" /></label>
            <label>{{ t('b8.wd.methods') }}<n-checkbox-group v-model:value="rf.methods"><div class="b8-row"><n-checkbox v-for="m in rule.methods" :key="m" :value="m" :label="mt(m)" /></div></n-checkbox-group></label>
          </div>
          <n-button type="primary" size="small" style="margin-top:10px" :disabled="!rule.writable" :loading="busy" @click="saveRule">{{ t('b8.save') }}</n-button>
        </n-card>
      </n-tab-pane>
    </n-tabs>
    <n-modal :show="!!dlg" preset="card" style="width:min(460px,94vw)" :title="dlg ? t('b8.wd.' + dlg.kind) + ' · ' + dlg.r.apply_sn : ''" @update:show="(v: boolean) => !v && (dlg = null)">
      <template v-if="dlg">
        <p style="margin-top:0" data-b8="wd-confirm">{{ dlg.kind === 'reject' ? t('b8.wd.confirm_reject', { m: dlg.r.money }) : t('b8.wd.confirm_' + dlg.kind) }}</p>
        <n-input v-model:value="dlg.text" type="textarea" :rows="2" maxlength="200" :placeholder="dlg.kind === 'reject' ? t('b8.wd.reason') : t('b8.wd.remark')" data-b8="wd-text" />
        <div class="b8-row" style="justify-content:flex-end;margin-top:12px"><n-button @click="dlg = null">{{ t('b8.cancel') }}</n-button><n-button :type="dlg.kind === 'reject' ? 'error' : 'primary'" :loading="busy" data-b8="wd-ok" @click="doAct">{{ t('b8.confirm') }}</n-button></div>
      </template>
    </n-modal>
  </div>
</template>
