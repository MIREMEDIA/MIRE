<script setup lang="ts">
// B8-1 支付方式配置：vs_dramas_config group=payment（platform 开关 / pay_type 开关 / 商户参数；密钥只写不读）
import { fl, isSecret } from '../../fieldLabels'
import { computed, ref, watch } from 'vue'
import { NButton, NCard, NCheckbox, NCheckboxGroup, NInput, NSwitch, NAlert, NTag, useMessage } from 'naive-ui'
import { api } from '../../api'
import { t } from '../../b8i18n'
import B8Bar from './B8Bar.vue'
import { dbw, loadDbw } from '../../ro'
loadDbw('b8')
import './b8.css'
const props = defineProps<{ page: any; mode: string }>()
const PAGE2NAME: Record<string, string> = { pay_stripe: 'stripe', pay_m1pay: 'm1pay', pay_paypal: 'paypal', pay_apple: 'applepay', pay_antom: 'antom', pay_waffo: 'waffo', pay_airwallex: 'airwallex' }
const msg = useMessage()
const d = ref<any>(null); const err = ref(''); const busy = ref(''); const ed = ref<Record<string, any>>({})
const want = computed(() => PAGE2NAME[props.page.id] || '')
const shown = computed(() => { if (!d.value) return []; const one = d.value.list.filter((x: any) => x.name === want.value); return one.length ? one : d.value.list })
async function load() {
  err.value = ''
  try {
    d.value = await api('b8.pay.list')
    ed.value = Object.fromEntries(d.value.list.map((x: any) => [x.name, { platform: [...x.platform], pay_type: x.pay_type.map((p: any) => ({ i: p.i, status: p.status })), fields: Object.fromEntries(x.fields.map((f: any) => [f.key, f.value])) }]))
  } catch (e: any) { err.value = e.message }
}
watch(() => props.page.id, load, { immediate: true })
async function save(x: any) {
  const e = ed.value[x.name]; busy.value = x.name
  const fields: Record<string, string> = {}
  for (const f of x.fields) if (e.fields[f.key] !== f.value) fields[f.key] = e.fields[f.key]
  try { await api('b8.pay.save', {}, { name: x.name, platform: e.platform, pay_type: e.pay_type, fields }); msg.success(t('b8.saved')); await load() }
  catch (z: any) { msg.error(z.message) } finally { busy.value = '' }
}
</script>
<template>
  <div class="b8" data-b8="pay">
    <B8Bar :title="t('b8.pay.title') + (want ? ' · ' + page.t : '')" :writable="d?.writable" :db="dbw.b8" :hint="t('b8.pay.hint')" />
    <n-alert v-if="err" type="error">{{ err }}</n-alert>
    <n-alert v-if="d && want && !d.list.some((x: any) => x.name === want)" type="info">{{ t('b8.pay.missing', { n: want }) }}</n-alert>
    <n-card v-for="x in shown" :key="x.name" size="small" :title="(x.title || x.name) + ' · ' + x.name" :data-pay="x.name">
      <div class="b8-grid">
        <label>{{ t('b8.pay.platform') }}
          <n-checkbox-group v-model:value="ed[x.name].platform"><div class="b8-row"><n-checkbox v-for="p in d.platforms" :key="p" :value="p" :label="p" /></div></n-checkbox-group></label>
        <label v-if="x.pay_type.length">{{ t('b8.pay.types') }}
          <div v-for="(p, k) in x.pay_type" :key="p.i" class="b8-row"><n-switch v-model:value="ed[x.name].pay_type[k].status" :checked-value="1" :unchecked-value="0" size="small" /> {{ p.name }} <n-tag v-if="p.type" size="tiny">{{ p.type }}</n-tag></div></label>
      </div>
      <p class="muted" style="margin:10px 0 4px;font-size:13px">{{ t('b8.pay.fields') }}</p>
      <div class="b8-grid">
        <label v-for="f in x.fields" :key="f.key" :title="f.key">{{ fl(f.key) }} <n-tag v-if="f.secret" size="tiny" :type="f.set ? 'success' : 'warning'">{{ f.set ? t('b8.pay.secret_set') : t('b8.pay.secret_unset') }}</n-tag>
          <n-input v-model:value="ed[x.name].fields[f.key]" size="small" :type="f.secret || isSecret(f.key) ? 'password' : 'text'" :placeholder="f.secret ? t('b8.pay.secret_ph') : ''" show-password-on="click" /></label>
      </div>
      <div style="margin-top:10px"><n-button type="primary" size="small" :disabled="!d.writable" :loading="busy === x.name" @click="save(x)">{{ t('b8.save') }}</n-button></div>
    </n-card>
  </div>
</template>
