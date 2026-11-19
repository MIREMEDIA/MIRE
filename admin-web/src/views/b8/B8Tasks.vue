<script setup lang="ts">
import PageLoading from '../../components/PageLoading.vue'
// B8-2 任务（b8.task.*：标题/描述/奖励/次数/排序/上下架）+ 签到规则（b4.sign.rules*，与 UserSignProvider 同字段同校验）+ 签到记录
import { fl } from '../../fieldLabels'
import { h, ref, watch } from 'vue'
import { NButton, NCard, NInput, NInputNumber, NSelect, NSwitch, NTabs, NTabPane, NAlert, useMessage } from 'naive-ui'
import { api } from '../../api'
import { t, fmtTime } from '../../b8i18n'
import '../../b10i18n'
import MTable from '../../components/MTable.vue'
import B8Bar from './B8Bar.vue'
import { dbw, loadDbw, roReason } from '../../ro'
import RoTip from '../../components/RoTip.vue'
loadDbw('b8')
import './b8.css'
const props = defineProps<{ page: any; mode: string }>()
const msg = useMessage()
const err = ref(''); const busy = ref('')
const d = ref<any>(null); const ed = ref<Record<string, any>>({})
const stOpts = () => [{ label: t('b8.on'), value: 'normal' }, { label: t('b8.off'), value: 'hidden' }]
async function loadTasks() {
  d.value = await api('b8.task.list')
  ed.value = Object.fromEntries([...d.value.task.map((r: any) => ['task' + r.id, { ...r, usable: +r.usable, limit: +r.limit }]), ...d.value.job.map((r: any) => ['job' + r.id, { ...r, usable: +r.usable, weigh: +r.weigh, title_i18n: { ...(r.title_i18n || {}) } }])])
}
async function saveTask(table: string, r: any) {
  const e = ed.value[table + r.id]; busy.value = table + r.id
  const body: any = { table, id: r.id, title: e.title, usable: e.usable, status: e.status }
  if (table === 'task') Object.assign(body, { desc: e.desc, limit: e.limit }); else { Object.assign(body, { weigh: e.weigh, condition: e.condition, title_i18n: e.title_i18n }); delete body.title }
  try { await api('b8.task.save', {}, body); msg.success(t('b8.saved')); await loadTasks() } catch (x: any) { msg.error(x.message) } finally { busy.value = '' }
}
const roT = () => roReason(d.value?.writable, dbw.b8)
const btn = (table: string, r: any) => h(RoTip, { reason: roT() }, () => h(NButton, { size: 'small', type: 'primary', disabled: d.value?.writable !== true, 'data-ro-btn': 'task-save', loading: busy.value === table + r.id, onClick: () => saveTask(table, r) }, () => t('b8.save')))
const inp = (k: string, key: string, w = 160) => h(NInput, { size: 'small', value: ed.value[k][key], 'onUpdate:value': (v: string) => (ed.value[k][key] = v), style: `min-width:${w}px` })
const num = (k: string, key: string, min: number, max: number) => h(NInputNumber, { size: 'small', value: ed.value[k][key], min, max, 'onUpdate:value': (v: number | null) => (ed.value[k][key] = v ?? 0), style: 'width:110px' })
// B10 #4: H5 读 vs_dramas_job.title = JSON {语种: 文案}；每个语种一个输入框（旧纯文本放在 _raw，保存时转成 JSON）
const jobTitles = (k: string) => h('div', { class: 'b10-jt', 'data-b10': 'job-titles' }, [
  ...((d.value?.langs || []) as any[]).map((l: any) => h('label', { style: 'display:flex;gap:4px;align-items:center;margin:2px 0' }, [h('span', { style: 'min-width:34px;font-size:12px' }, l.lang),
    h(NInput, { size: 'small', value: ed.value[k].title_i18n[l.lang] ?? '', maxlength: 100, 'data-b10': 'job-title-' + l.lang, placeholder: l.lang_cn || l.lang, 'onUpdate:value': (v: string) => (ed.value[k].title_i18n[l.lang] = v), style: 'min-width:150px' })])),
  ed.value[k].title_i18n._raw ? h('div', { class: 'muted', style: 'font-size:12px' }, t('b10.job.raw', { s: ed.value[k].title_i18n._raw })) : null])
const sel = (k: string) => h(NSelect, { size: 'small', value: ed.value[k].status, options: stOpts(), 'onUpdate:value': (v: string) => (ed.value[k].status = v), style: 'width:100px' })
const taskCols = () => [
  { title: t('b8.id'), key: 'id', width: 60 }, { title: t('b8.task.lang'), key: 'lang_id', width: 60 },
  { title: t('b8.title'), key: 'title', render: (r: any) => inp('task' + r.id, 'title') }, { title: t('b8.task.desc'), key: 'desc', render: (r: any) => inp('task' + r.id, 'desc', 180) },
  { title: t('b8.task.hook'), key: 'hook' }, { title: t('b8.type'), key: 'type' },
  { title: t('b8.task.usable'), key: 'usable', render: (r: any) => num('task' + r.id, 'usable', 0, 100000) }, { title: t('b8.task.limit'), key: 'limit', render: (r: any) => num('task' + r.id, 'limit', 1, 1000) },
  { title: t('b8.status'), key: 'status', render: (r: any) => sel('task' + r.id) }, { title: t('b8.op'), key: 'op', render: (r: any) => btn('task', r) }]
const jobCols = () => [
  { title: t('b8.id'), key: 'id', width: 60 }, { title: t('b10.job.titles'), key: 'title', render: (r: any) => jobTitles('job' + r.id) },
  { title: t('b8.task.category'), key: 'category' }, { title: t('b8.task.hook'), key: 'event', render: (r: any) => r.event ? `${fl(r.event)}（${r.event}）` : '' }, { title: t('b8.task.condition'), key: 'condition', render: (r: any) => inp('job' + r.id, 'condition', 100) },
  { title: t('b8.task.usable'), key: 'usable', render: (r: any) => num('job' + r.id, 'usable', 0, 100000) }, { title: t('b8.task.weigh'), key: 'weigh', render: (r: any) => num('job' + r.id, 'weigh', 0, 999999) },
  { title: t('b8.status'), key: 'status', render: (r: any) => sel('job' + r.id) }, { title: t('b8.op'), key: 'op', render: (r: any) => btn('job', r) }]
// sign-in
const sr = ref<any>(null); const rf = ref<any>(null); const sd = ref<any>(null); const sf = ref({ user_id: '', page: 1 })
async function loadSign() {
  sr.value = await api('b4.sign.rules'); rf.value = JSON.parse(JSON.stringify(sr.value.rules))
  sd.value = await api('b4.sign.records', { ...sf.value, size: 20 })
}
async function saveRules() {
  busy.value = 'rules'
  try { const r = await api('b4.sign.rules.save', {}, rf.value); msg.success(t('b8.saved')); sr.value = { ...sr.value, rules: r.rules, preview: r.preview }; rf.value = JSON.parse(JSON.stringify(r.rules)) }
  catch (x: any) { msg.error(x.message) } finally { busy.value = '' }
}
const signCols = () => [{ title: t('b8.id'), key: 'id' }, { title: t('b8.user_id'), key: 'user_id' }, { title: t('b8.sign.date'), key: 'date' }, { title: t('b8.sign.score'), key: 'score' },
  { title: t('b8.sign.replenish'), key: 'is_replenish', render: (r: any) => +r.is_replenish ? t('b8.yes') : '' }, { title: t('b8.time'), key: 'createtime', render: (r: any) => fmtTime(r.createtime) }]
async function load() { err.value = ''; try { if (props.mode === 'signin') await loadSign(); else await loadTasks() } catch (e: any) { err.value = e.message } }
watch(() => props.mode, load, { immediate: true })
watch(() => sf.value.page, () => props.mode === 'signin' && load())
</script>
<template>
  <div class="b8" :data-b8="mode">
    <template v-if="mode === 'tasks'">
      <B8Bar :title="t('b8.task.title')" :writable="d?.writable" :db="dbw.b8" :hint="t('b8.task.hint')" />
      <n-alert v-if="err" type="error">{{ err }}</n-alert>
      <PageLoading v-if="!d && !err" />
      <n-tabs v-if="d" type="line">
        <n-tab-pane name="job" :tab="t('b8.task.job')"><n-alert type="info" style="margin-bottom:6px">{{ t('b10.job.hint') }}</n-alert><MTable :columns="jobCols()" :data="d.job" :row-key="(r: any) => r.id" size="small" :scroll-x="1200" /></n-tab-pane>
        <n-tab-pane name="task" :tab="t('b8.task.task')"><MTable :columns="taskCols()" :data="d.task" :row-key="(r: any) => r.id" size="small" :scroll-x="1100" /></n-tab-pane>
      </n-tabs>
    </template>
    <template v-else>
      <B8Bar :title="t('b8.sign.title')" :writable="sr?.writable" :db="dbw.b8" />
      <n-alert v-if="err" type="error">{{ err }}</n-alert>
      <n-card v-if="rf" size="small" data-b8="sign-rules">
        <n-alert v-if="!sr.exists" type="warning" style="margin-bottom:8px">{{ t('b8.sign.missing') }}</n-alert>
        <div class="b8-grid">
          <label>{{ t('b8.sign.everyday') }}<n-input-number v-model:value="rf.everyday" :min="0" :max="100000" size="small" /></label>
          <label>{{ t('b8.sign.is_inc') }}<n-switch v-model:value="rf.is_inc" :checked-value="1" :unchecked-value="0" /></label>
          <label>{{ t('b8.sign.inc_num') }}<n-input-number v-model:value="rf.inc_num" :min="0" :max="100000" size="small" :disabled="!rf.is_inc" /></label>
          <label>{{ t('b8.sign.until_day') }}<n-input-number v-model:value="rf.until_day" :min="0" :max="365" size="small" :disabled="!rf.is_inc" /></label>
          <label>{{ t('b8.sign.is_replenish') }}<n-switch v-model:value="rf.is_replenish" :checked-value="1" :unchecked-value="0" /></label>
          <label>{{ t('b8.sign.replenish_days') }}<n-input-number v-model:value="rf.replenish_days" :min="1" :max="365" size="small" :disabled="!rf.is_replenish" /></label>
          <label>{{ t('b8.sign.replenish_limit') }}<n-input-number v-model:value="rf.replenish_limit" :min="0" :max="365" size="small" :disabled="!rf.is_replenish" /></label>
          <label>{{ t('b8.sign.replenish_num') }}<n-input-number v-model:value="rf.replenish_num" :min="1" :max="100000" size="small" :disabled="!rf.is_replenish" /></label>
        </div>
        <p class="muted" style="margin:10px 0 4px;font-size:13px">{{ t('b8.sign.is_discounts') }} <n-switch v-model:value="rf.is_discounts" :checked-value="1" :unchecked-value="0" size="small" /></p>
        <div v-for="(x, i) in rf.discounts" :key="i" class="b8-row" :data-disc="i" style="margin:4px 0">{{ t('b8.sign.full') }}<n-input-number v-model:value="x.full" :min="1" :max="365" size="small" style="width:90px" />{{ t('b8.sign.value') }}<n-input-number v-model:value="x.value" :min="0" :max="100000" size="small" style="width:110px" /><n-button size="small" @click="rf.discounts.splice(i, 1)">{{ t('b8.delete') }}</n-button></div>
        <div class="b8-row" style="margin-top:8px"><n-button size="small" @click="rf.discounts.push({ full: (rf.discounts.at(-1)?.full || 0) + 1, value: 0 })">{{ t('b8.sign.add') }}</n-button>
          <RoTip :reason="roReason(sr.writable, dbw.b8)"><n-button type="primary" size="small" data-b8="save-rules" :disabled="sr.writable !== true || !sr.exists" :loading="busy === 'rules'" @click="saveRules">{{ t('b8.save') }}</n-button></RoTip></div>
        <p v-if="sr.preview" class="muted" style="margin:8px 0 0;font-size:13px" data-b8="sign-preview">{{ t('b8.sign.preview', { n: sr.preview.length }) }}：<span v-for="p in sr.preview" :key="p.day" style="margin-right:8px">D{{ p.day }} {{ p.score }}</span></p>
      </n-card>
      <h3 style="margin:4px 0 0">{{ t('b8.sign.records') }}</h3>
      <div class="b8-f"><n-input v-model:value="sf.user_id" :placeholder="t('b8.user_id')" clearable @keyup.enter="sf.page = 1; load()" /><n-button type="primary" @click="sf.page = 1; load()">{{ t('b8.search') }}</n-button></div>
      <MTable :loading="!sd" :columns="signCols()" :data="sd?.rows || []" remote size="small" :pagination="{ page: sf.page, pageSize: 20, itemCount: sd?.total, onUpdatePage: (p: number) => (sf.page = p) }" />
    </template>
  </div>
</template>
