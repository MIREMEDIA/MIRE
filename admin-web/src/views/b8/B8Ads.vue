<script setup lang="ts">
// B8-7 广告 CRUD（vs_dramas_ad，软删除/恢复）+ 广告 RSA 公钥（config.mire_ad_rsa，只存公钥；私钥只在服务器文件/env）
import { h, onMounted, ref } from 'vue'
import { NButton, NCard, NInput, NInputNumber, NTabs, NTabPane, NAlert, NModal, NSwitch, NTag, useMessage, useDialog } from 'naive-ui'
import { api } from '../../api'
import { t, fmtTime } from '../../b8i18n'
import '../../b10i18n'
import MTable from '../../components/MTable.vue'
import B8Bar from './B8Bar.vue'
import { dbw, loadDbw } from '../../ro'
loadDbw('b8')
import { usePaged } from './usePaged'
import './b8.css'
defineProps<{ page: any; mode: string }>()
const msg = useMessage(); const dialog = useDialog()
const A = usePaged('b8.ad.list', { deleted: '0', lang_id: '' })
const ed = ref<any>(null); const busy = ref('')
const blank = () => ({ id: 0, lang_id: 0, title: '', description: '', image: '', video: '', content: '', redirect_url: '' })
async function saveAd() { busy.value = 'ad'; try { await api('b8.ad.save', {}, ed.value); msg.success(t('b8.saved')); ed.value = null; await A.load() } catch (e: any) { msg.error(e.message) } finally { busy.value = '' } }
function del(r: any) { dialog.warning({ title: t('b8.delete'), content: t('b8.ad.confirm_delete', { n: r.title }), positiveText: t('b8.confirm'), negativeText: t('b8.cancel'), onPositiveClick: async () => { try { await api('b8.ad.delete', {}, { id: r.id }); msg.success(t('b8.saved')); await A.load() } catch (e: any) { msg.error(e.message) } } }) }
async function restore(r: any) { try { await api('b8.ad.restore', {}, { id: r.id }); msg.success(t('b8.saved')); await A.load() } catch (e: any) { msg.error(e.message) } }
const cols = () => [{ title: t('b8.id'), key: 'id', width: 60 }, { title: t('b8.task.lang'), key: 'lang_id', width: 60 }, { title: t('b8.title'), key: 'title' }, { title: t('b8.ad.description'), key: 'description' },
  { title: t('b8.ad.image'), key: 'image', render: (r: any) => r.image ? h('img', { src: r.image, style: 'max-width:80px;max-height:48px;border-radius:4px' }) : '' },
  { title: t('b8.ad.redirect'), key: 'redirect_url', render: (r: any) => h('span', { class: 'b8-code' }, r.redirect_url) }, { title: t('b8.time'), key: 'updatetime', render: (r: any) => fmtTime(r.updatetime || r.createtime) },
  { title: t('b8.op'), key: 'op', render: (r: any) => h('div', { class: 'b8-row' }, r.deletetime ? [h(NButton, { size: 'small', disabled: !A.d.value?.writable, onClick: () => restore(r) }, () => t('b8.restore'))]
      : [h(NButton, { size: 'small', type: 'primary', disabled: !A.d.value?.writable, 'data-ad-edit': r.id, onClick: () => (ed.value = { ...blank(), ...r, lang_id: +r.lang_id }) }, () => t('b8.edit')),
         h(NButton, { size: 'small', type: 'error', ghost: true, disabled: !A.d.value?.writable, 'data-ad-del': r.id, onClick: () => del(r) }, () => t('b8.delete'))]) }]
// RSA
const rsa = ref<any>(null); const pem = ref(''); const rerr = ref('')
async function loadRsa() { rerr.value = ''; try { rsa.value = await api('b8.rsa.get'); pem.value = rsa.value.public_key } catch (e: any) { rerr.value = e.message } }
async function saveRsa() { busy.value = 'rsa'; try { await api('b8.rsa.save', {}, { public_key: pem.value }); msg.success(t('b8.saved')); await loadRsa() } catch (e: any) { msg.error(e.message) } finally { busy.value = '' } }
onMounted(() => { A.load(); loadRsa() })
</script>
<template>
  <div class="b8" data-b8="ads">
    <B8Bar :title="t('b8.ad.title')" :writable="A.d.value?.writable" :db="dbw.b8" />
    <n-tabs type="line">
      <n-tab-pane name="list" :tab="t('b8.ad.list')">
        <div class="b8-f">
          <n-button type="primary" :disabled="!A.d.value?.writable" data-b8="ad-add" @click="ed = blank()">{{ t('b8.add') }}</n-button>
          <span class="b8-row">{{ t('b8.ad.deleted') }} <n-switch :value="A.f.value.deleted === '1'" @update:value="(v: boolean) => { A.f.value.deleted = v ? '1' : '0'; A.search() }" /></span>
        </div>
        <n-alert v-if="A.err.value" type="error">{{ A.err.value }}</n-alert>
        <MTable :columns="cols()" :data="A.d.value?.list || []" remote size="small" :loading="A.loading.value || !A.d.value" :pagination="A.pag()" />
      </n-tab-pane>
      <n-tab-pane name="rsa" :tab="t('b8.ad.rsa')">
        <n-alert v-if="rerr" type="error">{{ rerr }}</n-alert>
        <n-alert v-if="rsa && !rsa.exists" type="warning">{{ t('b8.rsa.missing') }}</n-alert>
        <n-card v-if="rsa" size="small" data-b8="rsa">
          <p class="muted" style="margin-top:0;font-size:13px">{{ t('b8.rsa.hint', { p: rsa.private_key_hint }) }}</p>
          <div class="b8-row" style="margin-bottom:8px" data-b8="rsa-info">
            <template v-if="!rsa.info.set"><n-tag type="warning">{{ t('b8.rsa.unset') }}</n-tag></template>
            <template v-else-if="!rsa.info.valid"><n-tag type="error">{{ t('b8.rsa.invalid') }}</n-tag></template>
            <template v-else>
              <n-tag type="success">RSA {{ rsa.info.bits }}</n-tag><span class="b8-code">{{ t('b8.rsa.fp') }}: {{ rsa.info.fingerprint }}</span>
              <n-tag v-if="rsa.info.pair_check !== null" :type="rsa.info.pair_check ? 'success' : 'error'">{{ t('b8.rsa.pair') }}: {{ rsa.info.pair_check ? t('b8.yes') : t('b8.no') }}</n-tag>
              <span v-else class="muted" style="font-size:12px">{{ t('b8.rsa.pair_na') }}</span>
              <span v-if="rsa.updated" class="muted" style="font-size:12px">{{ t('b8.rsa.updated') }} {{ fmtTime(rsa.updated) }}</span>
            </template>
          </div>
          <div class="b8-row" style="margin-bottom:8px;flex-wrap:wrap" data-b10="rsa-in-use">
            <b>{{ t('b10.rsa.in_use') }}</b>
            <template v-if="rsa.in_use?.set"><n-tag type="success">{{ rsa.in_use.source }} · RSA {{ rsa.in_use.bits }}</n-tag><span class="b8-code" data-b10="rsa-fp">{{ t('b8.rsa.fp') }}: {{ rsa.in_use.fingerprint }}</span>
              <n-tag v-if="rsa.in_use.legacy_config_match === false" type="warning">{{ t('b10.rsa.mismatch') }}</n-tag></template>
            <n-tag v-else type="error" data-b10="rsa-none">{{ rsa.in_use?.error || t('b8.rsa.unset') }}</n-tag>
          </div>
          <n-alert v-if="rsa.in_use?.perm_warning" type="warning" style="margin-bottom:8px" data-b10="rsa-perm">{{ rsa.in_use.perm_warning }}</n-alert>
          <details v-if="rsa.in_use?.public_key" style="margin-bottom:8px"><summary>{{ t('b10.rsa.show_pub') }}</summary><pre class="b8-code" style="white-space:pre-wrap;font-size:11px" data-b10="rsa-pub">{{ rsa.in_use.public_key }}</pre></details>
          <p class="muted" style="font-size:12px" data-b10="rsa-legacy">{{ t('b10.rsa.legacy') }}</p>
          <n-input v-model:value="pem" type="textarea" :rows="6" class="b8-code" :readonly="rsa.editable === false" :placeholder="'-----BEGIN PUBLIC KEY-----'" data-b8="rsa-pem" />
          <n-button type="primary" size="small" style="margin-top:8px" :disabled="rsa.editable === false || !rsa.writable || !rsa.exists" :loading="busy === 'rsa'" data-b8="rsa-save" @click="saveRsa">{{ t('b8.save') }}</n-button>
        </n-card>
      </n-tab-pane>
    </n-tabs>
    <n-modal :show="!!ed" preset="card" style="width:min(560px,96vw)" :title="ed && ed.id ? t('b8.edit') + ' #' + ed.id : t('b8.add')" @update:show="(v: boolean) => !v && (ed = null)">
      <div v-if="ed" class="b8-grid" data-b8="ad-form">
        <label>{{ t('b8.ad.lang_id') }}<n-input-number v-model:value="ed.lang_id" :min="0" size="small" /></label>
        <label>{{ t('b8.title') }}<n-input v-model:value="ed.title" size="small" maxlength="255" data-b8="ad-title" /></label>
        <label>{{ t('b8.ad.description') }}<n-input v-model:value="ed.description" size="small" maxlength="255" /></label>
        <label>{{ t('b8.ad.image') }}<n-input v-model:value="ed.image" size="small" placeholder="https://" /></label>
        <label>{{ t('b8.ad.video') }}<n-input v-model:value="ed.video" size="small" placeholder="https://" /></label>
        <label>{{ t('b8.ad.redirect') }}<n-input v-model:value="ed.redirect_url" size="small" placeholder="https://" /></label>
        <label style="grid-column:1/-1">{{ t('b8.ad.content') }}<n-input v-model:value="ed.content" type="textarea" :rows="3" /></label>
      </div>
      <div class="b8-row" style="justify-content:flex-end;margin-top:12px"><n-button @click="ed = null">{{ t('b8.cancel') }}</n-button><n-button type="primary" :loading="busy === 'ad'" data-b8="ad-save" @click="saveAd">{{ t('b8.save') }}</n-button></div>
    </n-modal>
  </div>
</template>
