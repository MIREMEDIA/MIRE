<script setup lang="ts">
// B8-3 分享/邀请记录（vs_dramas_share，大表：不精确计数）+ 分享活动配置（config.activity.share/ad）+ 分享海报配置（config.share 标量字段）
import { ref, onMounted } from 'vue'
import { NButton, NCard, NInput, NInputNumber, NSelect, NSwitch, NTabs, NTabPane, NAlert, useMessage } from 'naive-ui'
import { api } from '../../api'
import { t, fmtTime } from '../../b8i18n'
import MTable from '../../components/MTable.vue'
import B8Bar from './B8Bar.vue'
import { dbw, loadDbw } from '../../ro'
loadDbw('b8')
import { usePaged } from './usePaged'
import './b8.css'
defineProps<{ page: any; mode: string }>()
const msg = useMessage()
const L = usePaged('b8.share.list', { user_id: '', share_id: '', type: '' })
const cfg = ref<any>(null); const act = ref<any>(null); const sh = ref<Record<string, string>>({}); const busy = ref(''); const cerr = ref('')
const typeOpts = () => [{ label: t('b8.all'), value: '' }, { label: t('b8.share.t_index'), value: 'index' }, { label: t('b8.share.t_add'), value: 'add' }]
const cols = () => [{ title: t('b8.id'), key: 'id' },
  { title: t('b8.share.invitee'), key: 'user_id', render: (r: any) => `#${r.user_id} ${r.nickname || ''}` }, { title: t('b8.share.inviter'), key: 'share_id', render: (r: any) => `#${r.share_id} ${r.share_nickname || ''}` },
  { title: t('b8.type'), key: 'type', render: (r: any) => r.type === 'add' ? t('b8.share.t_add') : r.type === 'index' ? t('b8.share.t_index') : r.type },
  { title: t('b8.share.platform'), key: 'platform' }, { title: t('b8.share.source'), key: 'share_platform' }, { title: t('b8.share.from'), key: 'from' }, { title: t('b8.time'), key: 'createtime', render: (r: any) => fmtTime(r.createtime) }]
async function loadCfg() {
  cerr.value = ''
  try {
    cfg.value = await api('b8.share.cfg')
    const a = cfg.value.activity || null
    act.value = a ? Object.fromEntries(['share', 'ad'].map(k => [k, { status: +(a[k]?.status || 0), limit: +(a[k]?.limit || 0), usable: +(a[k]?.usable || 0) }])) : null
    sh.value = { ...(cfg.value.share || {}) }
  } catch (e: any) { cerr.value = e.message }
}
async function saveAct() { busy.value = 'act'; try { await api('b8.activity.save', {}, act.value); msg.success(t('b8.saved')); await loadCfg() } catch (e: any) { msg.error(e.message) } finally { busy.value = '' } }
async function saveSh() {
  const ch: Record<string, string> = {}; for (const k in sh.value) if (sh.value[k] !== cfg.value.share[k]) ch[k] = sh.value[k]
  busy.value = 'sh'; try { await api('b8.share.cfg.save', {}, { share: ch }); msg.success(t('b8.saved')); await loadCfg() } catch (e: any) { msg.error(e.message) } finally { busy.value = '' }
}
onMounted(() => { L.load(); loadCfg() })
</script>
<template>
  <div class="b8" data-b8="share">
    <B8Bar :title="t('b8.share.title')" :writable="cfg?.writable" :db="dbw.b8" />
    <n-tabs type="line">
      <n-tab-pane name="rec" :tab="t('b8.share.records')">
        <div class="b8-f">
          <n-input v-model:value="L.f.value.user_id" :placeholder="t('b8.share.invitee') + ' ID'" clearable @keyup.enter="L.search" />
          <n-input v-model:value="L.f.value.share_id" :placeholder="t('b8.share.inviter') + ' ID'" clearable @keyup.enter="L.search" />
          <n-select v-model:value="L.f.value.type" :options="typeOpts()" />
          <n-button type="primary" @click="L.search">{{ t('b8.search') }}</n-button>
        </div>
        <n-alert v-if="L.err.value" type="error">{{ L.err.value }}</n-alert>
        <p v-if="L.d.value" class="muted" style="margin:6px 0">{{ L.d.value.total_capped && !L.loading.value ? t('b8.total_capped', { n: L.loading.value ? '—' : L.d.value.total }) : t('b8.total', { n: L.loading.value ? '—' : L.d.value.total }) }}</p>
        <MTable :columns="cols()" :data="L.d.value?.list || []" remote size="small" :loading="L.loading.value || !L.d.value" :pagination="L.pag()" />
      </n-tab-pane>
      <n-tab-pane name="act" :tab="t('b8.share.activity')">
        <n-alert v-if="cerr" type="error">{{ cerr }}</n-alert>
        <n-alert v-if="cfg && !act" type="warning">{{ t('b8.act.missing') }}</n-alert>
        <n-card v-if="act" size="small" data-b8="activity">
          <div v-for="k in ['share', 'ad']" :key="k" style="margin-bottom:10px">
            <h4 style="margin:0 0 6px">{{ t('b8.act.' + k) }}</h4>
            <div class="b8-grid">
              <label>{{ t('b8.status') }}<n-switch v-model:value="act[k].status" :checked-value="1" :unchecked-value="0" /></label>
              <label>{{ t('b8.act.limit') }}<n-input-number v-model:value="act[k].limit" :min="0" :max="1000" size="small" /></label>
              <label>{{ t('b8.act.usable') }}<n-input-number v-model:value="act[k].usable" :min="0" :max="100000" size="small" /></label>
            </div>
          </div>
          <n-button type="primary" size="small" :disabled="!cfg.writable" :loading="busy === 'act'" @click="saveAct">{{ t('b8.save') }}</n-button>
        </n-card>
        <h4 style="margin:12px 0 6px">{{ t('b8.share.cfg') }}</h4>
        <n-alert v-if="cfg && cfg.share === null" type="warning">{{ t('b8.share.cfg_missing') }}</n-alert>
        <n-card v-else-if="cfg" size="small" data-b8="share-cfg">
          <div class="b8-grid"><label v-for="(_v, k) in cfg.share" :key="k">{{ k }}<n-input v-model:value="sh[k]" size="small" /></label></div>
          <n-button type="primary" size="small" style="margin-top:8px" :disabled="!cfg.writable" :loading="busy === 'sh'" @click="saveSh">{{ t('b8.save') }}</n-button>
        </n-card>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>
