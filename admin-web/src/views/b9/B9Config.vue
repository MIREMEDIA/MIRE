<script setup lang="ts">
import MTable from '../../components/MTable.vue'  // FE-M4: 手机端卡片，桌面列最小宽度+不换行
import PageLoading from '../../components/PageLoading.vue'
// B9: mode 'tip' = 打赏配置（mire_tip），mode 'currency' = 提现币种与汇率（vs_lang）
import { h, onMounted, ref } from 'vue'
import { NButton, NCard, NInput, NInputNumber, NAlert, NTag, NRadioGroup, NRadio, useMessage } from 'naive-ui'
import { api } from '../../api'
import { t } from '../../b8i18n'
import '../../b9i18n'
import B8Bar from '../b8/B8Bar.vue'
import '../b8/b8.css'
const props = defineProps<{ page: any; mode: string }>()
const msg = useMessage()
const busy = ref(false); const errText = ref('')
// tip
const tip = ref<any>(null); const tf = ref<any>({ min: 1, max: 5, presets: '' })
async function loadTip() {
  errText.value = ''
  try { tip.value = await api('b9.tip.get'); const r = tip.value.rule; tf.value = { min: r.min, max: r.max, presets: r.presets.join(',') } } catch (e: any) { errText.value = e.message }
}
async function saveTip() {
  busy.value = true
  try {
    const presets = String(tf.value.presets).split(/[,，\s]+/).filter(Boolean).map(Number)
    await api('b9.tip.save', {}, { min: tf.value.min, max: tf.value.max, presets }); msg.success(t('b8.saved')); await loadTip()
  } catch (e: any) { msg.error(e.message) } finally { busy.value = false }
}
// B17: M1Pay currency mode + FX (mire_m1pay_fx), shown on the config page under the tip rule
const fx = ref<any>(null); const ff = ref<any>({ mode: 'myr_only', rates: {} as Record<string, string> }); const fxErr = ref('')
async function loadFx() {
  fxErr.value = ''
  try { fx.value = await api('b9.m1fx.get'); const r: Record<string, string> = {}; for (const c of fx.value.currencies) if (c !== 'MYR') r[c] = String((fx.value.fx.rates || {})[c] ?? ''); ff.value = { mode: fx.value.fx.mode, rates: r } } catch (e: any) { fxErr.value = e.message }
}
async function saveFx() {
  busy.value = true
  try { await api('b9.m1fx.save', {}, { mode: ff.value.mode, rates: ff.value.rates }); msg.success(t('b8.saved')); await loadFx() } catch (e: any) { msg.error(e.message) } finally { busy.value = false }
}
// currency
const cur = ref<any>(null); const edit = ref<Record<number, any>>({})
async function loadCur() {
  errText.value = ''
  try { cur.value = await api('b9.cur.list'); const e: Record<number, any> = {}; for (const l of cur.value.list) e[l.id] = { currency: l.currency, exchange_rate: l.exchange_rate }; edit.value = e } catch (e: any) { errText.value = e.message }
}
async function saveCur(id: number) {
  busy.value = true
  try { cur.value = await api('b9.cur.save', {}, { id, ...edit.value[id] }); msg.success(t('b8.saved')); await loadCur() } catch (e: any) { msg.error(e.message) } finally { busy.value = false }
}
const curCols = () => [
  { title: t('b8.id'), key: 'id', width: 60 },
  { title: t('b9.cur.lang'), key: 'lang', render: (r: any) => `${r.lang} ${r.lang_cn || ''}` },
  { title: t('b9.cur.currency'), key: 'currency', render: (r: any) => h(NInput, { size: 'small', value: edit.value[r.id]?.currency, maxlength: 3, style: 'width:90px', 'data-b9': 'cur-' + r.id, 'onUpdate:value': (v: string) => { edit.value[r.id].currency = v.toUpperCase() } }) },
  { title: t('b9.cur.rate'), key: 'exchange_rate', render: (r: any) => h(NInputNumber, { size: 'small', value: edit.value[r.id]?.exchange_rate, min: 1, style: 'width:140px', 'data-b9': 'rate-' + r.id, 'onUpdate:value': (v: number | null) => { edit.value[r.id].exchange_rate = v } }) },
  { title: t('b9.cur.ready'), key: 'ready', render: (r: any) => h(NTag, { size: 'small', type: r.ready ? 'success' : 'error' }, () => r.ready ? t('b8.yes') : t('b8.no')) },
  { title: t('b9.cur.ads'), key: 'ads', render: (r: any) => h(NTag, { size: 'small', type: r.ads ? 'default' : 'warning' }, () => String(r.ads)) },
  { title: t('b8.op'), key: 'op', render: (r: any) => h(NButton, { size: 'small', type: 'primary', disabled: !cur.value?.writable, loading: busy.value, 'data-b9': 'save-' + r.id, onClick: () => saveCur(r.id) }, () => t('b8.save')) },
]
onMounted(() => { if (props.mode === 'tip') { loadTip(); loadFx() } else loadCur() })
</script>
<template>
  <div class="b8" :data-b9="mode">
    <template v-if="mode === 'tip'">
      <B8Bar :title="t('b9.tip.title')" :writable="tip?.writable" :hint="t('b9.tip.hint')" />
      <n-alert v-if="errText" type="error">{{ errText }}</n-alert>
      <n-alert v-if="tip && !tip.row" type="warning" data-b9="tip-missing">{{ t('b9.tip.missing') }}</n-alert>
      <n-card v-if="tip" size="small" data-b9="tip-form">
        <p class="muted" data-b9="tip-effective">{{ t('b9.tip.effective', { min: tip.rule.min, max: tip.rule.max, p: tip.rule.presets.join(' / ') }) }}</p>
        <div class="b8-grid">
          <label>{{ t('b9.tip.min') }}<n-input-number v-model:value="tf.min" :min="1" :max="tip.cap" size="small" data-b9="tip-min" /></label>
          <label>{{ t('b9.tip.max') }}<n-input-number v-model:value="tf.max" :min="1" :max="tip.cap" size="small" data-b9="tip-max" /></label>
          <label>{{ t('b9.tip.presets') }}<n-input v-model:value="tf.presets" size="small" data-b9="tip-presets" /></label>
        </div>
        <n-button type="primary" size="small" style="margin-top:10px" :disabled="!tip.writable || !tip.row" :loading="busy" data-b9="tip-save" @click="saveTip">{{ t('b8.save') }}</n-button>
      </n-card>
      <n-card size="small" style="margin-top:14px" :title="t('b17.fx.title')" data-b17="fx-card">
        <p class="muted">{{ t('b17.fx.hint') }}</p>
        <n-alert v-if="fxErr" type="error">{{ fxErr }}</n-alert>
        <n-alert v-if="fx && !fx.row" type="warning" data-b17="fx-missing">{{ t('b17.fx.missing') }}</n-alert>
        <template v-if="fx">
          <p class="muted" data-b17="fx-effective">{{ t('b17.fx.effective', { m: t('b17.fx.' + fx.fx.mode), c: fx.offered.join(' / ') }) }}<span v-if="fx.example"> · USD 2.90 → MYR {{ fx.example.myr }}</span></p>
          <n-radio-group v-model:value="ff.mode" size="small" data-b17="fx-mode"><n-radio value="myr_only" data-b17="fx-myr_only">{{ t('b17.fx.myr_only') }}</n-radio><n-radio value="convert" data-b17="fx-convert">{{ t('b17.fx.convert') }}</n-radio></n-radio-group>
          <div v-if="ff.mode === 'convert'" class="row" style="flex-wrap:wrap;gap:10px;margin-top:8px">
            <label v-for="(_v, c) in ff.rates" :key="c">{{ t('b17.fx.rate', { c }) }}<n-input v-model:value="ff.rates[c]" size="small" style="width:130px" placeholder="—" :data-b17="'fx-rate-' + c" /></label>
          </div>
          <n-button type="primary" size="small" style="margin-top:10px" :disabled="!fx.writable || !fx.row" :loading="busy" data-b17="fx-save" @click="saveFx">{{ t('b8.save') }}</n-button>
        </template>
      </n-card>
    </template>
    <template v-else>
      <B8Bar :title="t('b9.cur.title')" :writable="cur?.writable" :hint="t('b9.cur.hint')" />
      <n-alert v-if="errText" type="error">{{ errText }}</n-alert>
      <n-alert v-if="cur && !cur.list.some((l: any) => l.ready)" type="warning" data-b9="cur-none">{{ t('b9.cur.none_ready') }}</n-alert>
      <PageLoading v-if="!cur" :rows="4" />
      <MTable v-else size="small" :columns="curCols()" :data="cur.list" :row-key="(r: any) => r.id" :scroll-x="720" data-b9="cur-table" />
    </template>
  </div>
</template>
