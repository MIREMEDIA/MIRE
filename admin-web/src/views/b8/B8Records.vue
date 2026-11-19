<script setup lang="ts">
// B8-4 收藏/点赞 + 观看记录/追剧（只读）；B8-5 短信/邮件验证码记录（只读，验证码不明文）
import { h, onMounted, ref, watch } from 'vue'
import { NButton, NInput, NSelect, NTabs, NTabPane, NAlert, NTag } from 'naive-ui'
import { t, fmtTime } from '../../b8i18n'
import '../../b10i18n'
import MTable from '../../components/MTable.vue'
import B8Bar from './B8Bar.vue'
import { usePaged } from './usePaged'
import './b8.css'
const props = defineProps<{ page: any; mode: string }>()
const tab = ref(props.mode === 'sms_log' ? 'sms' : 'fav')
const F = usePaged('b8.fav.list', { user_id: '', vid: '', type: '' })
const V = usePaged('b8.vlog.list', { user_id: '', vid: '', type: '' })
const S = usePaged('b8.sms.list', { src: 'all', event: '', kw: '', status: '' })   // B10 #5: 默认短信+邮件
const vt = (x: string) => ({ like: t('b8.vlog.t_like'), favorite: t('b8.vlog.t_favorite'), log: t('b8.vlog.t_log') } as any)[x] || x
const user = { title: t('b8.user_id'), key: 'user_id', render: (r: any) => `#${r.user_id} ${r.nickname || ''}` }
const video = { title: t('b8.vlog.video'), key: 'vid', render: (r: any) => `#${r.vid} ${r.video_title || ''}` }
const favCols = () => [{ title: t('b8.id'), key: 'id' }, { title: t('b8.type'), key: 'type', render: (r: any) => vt(r.type) }, user, video, { title: t('b8.vlog.episode'), key: 'episode_id' }, { title: t('b8.time'), key: 'createtime', render: (r: any) => fmtTime(r.createtime) }]
const logCols = () => [{ title: t('b8.id'), key: 'id' }, { title: t('b8.type'), key: 'type', render: (r: any) => vt(r.type) }, user, video, { title: t('b8.vlog.episode'), key: 'episode_id' }, { title: t('b8.vlog.view_time'), key: 'view_time', render: (r: any) => fmtTime(r.view_time || r.updatetime) }, { title: t('b8.time'), key: 'createtime', render: (r: any) => fmtTime(r.createtime) }]
const smsCols = () => [{ title: t('b8.id'), key: 'id' }, { title: t('b8.sms.event'), key: 'event' },
  { title: t('b10.sms.src'), key: 'src', render: (r: any) => r.src === 'ems' ? t('b8.sms.ems') : r.src === 'sms' ? t('b8.sms.sms') : (S.f.value.src === 'ems' ? t('b8.sms.ems') : t('b8.sms.sms')) },
  { title: t('b8.sms.target'), key: 'target', render: (r: any) => r.account ?? r.email ?? `${r.nation_code ? '+' + r.nation_code + ' ' : ''}${r.mobile}` },
  { title: t('b8.sms.code'), key: 'code' }, { title: t('b8.sms.times'), key: 'times' },
  { title: t('b8.status'), key: 'status', render: (r: any) => h(NTag, { size: 'small', type: r.status === 'used' ? 'info' : (r.status === 'expired' || r.expired) ? 'default' : 'success', 'data-b10': 'code-' + (r.status || (r.expired ? 'expired' : 'unused')) }, () => r.status === 'used' ? t('b10.sms.used') + (r.usetime ? ' ' + fmtTime(r.usetime) : '') : (r.status === 'expired' || r.expired) ? t('b8.sms.expired') : t('b8.sms.valid')) }, { title: t('b8.time'), key: 'createtime', render: (r: any) => fmtTime(r.createtime) }]
const typeOpts = (ks: string[]) => [{ label: t('b8.all'), value: '' }, ...ks.map(k => ({ label: vt(k), value: k }))]
const evOpts = () => [{ label: t('b8.all'), value: '' }, ...((S.d.value?.events || []) as string[]).map(e => ({ label: e, value: e }))]
function loadTab() { if (tab.value === 'fav' && !F.d.value) F.load(); if (tab.value === 'log' && !V.d.value) V.load(); if (tab.value === 'sms' && !S.d.value) S.load() }
watch(tab, loadTab); onMounted(loadTab)
watch(() => S.f.value.src, () => { S.f.value.event = ''; S.search() })
</script>
<template>
  <div class="b8" :data-b8="mode">
    <template v-if="mode === 'video_log'">
      <B8Bar :title="t('b8.vlog.title')" />
      <n-tabs v-model:value="tab" type="line">
        <n-tab-pane name="fav" :tab="t('b8.vlog.fav')">
          <div class="b8-f"><n-input v-model:value="F.f.value.user_id" :placeholder="t('b8.user_id')" clearable @keyup.enter="F.search" /><n-input v-model:value="F.f.value.vid" :placeholder="t('b8.vlog.vid')" clearable @keyup.enter="F.search" /><n-select v-model:value="F.f.value.type" :options="typeOpts(['like', 'favorite'])" /><n-button type="primary" @click="F.search">{{ t('b8.search') }}</n-button></div>
          <n-alert v-if="F.err.value" type="error">{{ F.err.value }}</n-alert>
          <p v-if="F.d.value" class="muted" style="margin:6px 0">{{ F.d.value.total_capped && !F.loading.value ? t('b8.total_capped', { n: F.loading.value ? '—' : F.d.value.total }) : t('b8.total', { n: F.loading.value ? '—' : F.d.value.total }) }}</p>
          <MTable :columns="favCols()" :data="F.d.value?.list || []" remote size="small" :loading="F.loading.value || !F.d.value" :pagination="F.pag()" />
        </n-tab-pane>
        <n-tab-pane name="log" :tab="t('b8.vlog.log')">
          <div class="b8-f"><n-input v-model:value="V.f.value.user_id" :placeholder="t('b8.user_id')" clearable @keyup.enter="V.search" /><n-input v-model:value="V.f.value.vid" :placeholder="t('b8.vlog.vid')" clearable @keyup.enter="V.search" /><n-select v-model:value="V.f.value.type" :options="typeOpts(['log', 'favorite'])" /><n-button type="primary" @click="V.search">{{ t('b8.search') }}</n-button></div>
          <n-alert v-if="V.err.value" type="error">{{ V.err.value }}</n-alert>
          <p v-if="V.d.value" class="muted" style="margin:6px 0">{{ V.d.value.total_capped && !V.loading.value ? t('b8.total_capped', { n: V.loading.value ? '—' : V.d.value.total }) : t('b8.total', { n: V.loading.value ? '—' : V.d.value.total }) }}</p>
          <MTable :columns="logCols()" :data="V.d.value?.list || []" remote size="small" :loading="V.loading.value || !V.d.value" :pagination="V.pag()" />
        </n-tab-pane>
      </n-tabs>
    </template>
    <template v-else>
      <B8Bar :title="t('b8.sms.title')" :hint="t('b8.sms.hint')" />
      <div class="b8-f">
        <n-select v-model:value="S.f.value.src" data-b10="sms-src" :options="[{ label: t('b10.sms.all'), value: 'all' }, { label: t('b8.sms.sms'), value: 'sms' }, { label: t('b8.sms.ems'), value: 'ems' }]" />
        <n-select v-if="S.f.value.src === 'all'" v-model:value="S.f.value.status" data-b10="sms-status" :options="[{ label: t('b8.all'), value: '' }, { label: t('b8.sms.valid'), value: 'unused' }, { label: t('b10.sms.used'), value: 'used' }, { label: t('b8.sms.expired'), value: 'expired' }]" />
        <n-select v-model:value="S.f.value.event" :options="evOpts()" :placeholder="t('b8.sms.event')" />
        <n-input v-model:value="S.f.value.kw" :placeholder="t('b8.sms.kw')" clearable @keyup.enter="S.search" />
        <n-button type="primary" @click="S.search">{{ t('b8.search') }}</n-button>
      </div>
      <n-alert v-if="S.err.value" type="error">{{ S.err.value }}</n-alert>
      <p v-if="S.d.value" class="muted" style="margin:6px 0">{{ t('b8.total', { n: S.loading.value ? '—' : S.d.value.total }) }}</p>
      <MTable :columns="smsCols()" :data="S.d.value?.list || []" remote size="small" :loading="S.loading.value || !S.d.value" :pagination="S.pag()" />
    </template>
  </div>
</template>
