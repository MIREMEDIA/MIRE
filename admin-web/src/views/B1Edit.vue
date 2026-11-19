<script setup lang="ts">
import PageLoading from '../components/PageLoading.vue'
// B1 editors: 35 site / 24 langs / 17 groups / 34 versions / 36 integrations (read-only) / 29 switches.
// Writes are only accepted by the API when it is connected to a *staging* DB (write_guard in api/lib.php).
import { ref, watch, computed } from 'vue'
import { NCard, NButton, NInput, NSwitch, NTable, NTag, NAlert, NSpace, NSelect, NPopconfirm, useMessage } from 'naive-ui'
import { api } from '../api'
import RoTip from '../components/RoTip.vue'
import { dbw, loadDbw, roReason } from '../ro'
loadDbw('b1')   // FE-M6
import { isMobile } from '../mobile'
import { fl, maskVal } from '../fieldLabels'
const props = defineProps<{ page: any; res: string }>()
const msg = useMessage()
const d = ref<any>(null); const err = ref(''); const busy = ref(false)
const edit = ref<any>(null); const editId = ref(0)
const copyFrom = ref<number | null>(null); const copyTo = ref<number | null>(null)
async function load() { err.value = ''; d.value = null; edit.value = null
  try { d.value = await api('b1.get', { res: props.res }) } catch (e: any) { err.value = e.message } }
watch(() => props.res, load, { immediate: true })
async function post(act: string, body: any, okMsg = '已保存') { busy.value = true
  try { const r = await api('b1.' + act, {}, { res: props.res, ...body }); msg.success(okMsg); await load(); return r } catch (e: any) { msg.error(e.message) } finally { busy.value = false } }
const isTable = computed(() => ['langs', 'groups', 'versions'].includes(props.res))
const cols = computed(() => Object.keys(d.value?.cols || {}))
function startEdit(row: any | null) { editId.value = row ? Number(row.id) : 0; const o: any = {}; cols.value.forEach(c => (o[c] = row ? String(row[c] ?? '') : '')); edit.value = o }
// B19：站点信息字段中文标签（system JSON 键名保留为小字）。company 在 FA 里是图片（addons/dramas Index::init 对它做 cdnurl），即公司 Logo，不是公司名称。
const SITE_LABEL: Record<string, string> = { name: '站点名称', logo: '站点 Logo（图片路径）', company: '公司 Logo（图片路径）', h5: 'H5 地址', domain: '域名', version: '版本号' }
const langOpts = computed(() => (props.res === 'langs' ? d.value?.rows || [] : []).map((x: any) => ({ label: `${x.id} · ${x.lang} ${x.lang_cn || ''}`, value: Number(x.id) })))
</script>
<template>
  <n-space vertical>
    <h2 style="margin:0">{{ page.t }}</h2>
    <n-alert v-if="err" type="error">{{ err }}</n-alert>
    <n-alert v-if="d && roReason(d.writable, dbw.b1)" type="warning" data-ro="banner">{{ roReason(d.writable, dbw.b1) }}</n-alert>
    <PageLoading v-if="!d && !err" />
    <template v-if="d && res === 'site'">
      <n-card title="站点信息（vs_dramas_config.system → H5 /index/init）">
        <div v-for="(_v, k) in d.fields" :key="k" style="display:flex;gap:8px;margin-bottom:8px;align-items:center"><b style="width:150px;flex:0 0 150px" :data-b19="'site-' + k">{{ SITE_LABEL[k] || k }}<br><span class="muted" style="font-weight:400">{{ k }}</span></b><n-input v-model:value="d.fields[k]" /></div>
        <p class="muted">FastAdmin vs_config.name：{{ d.fa_name }}（保存 name 时同步）。{{ d.note }}</p>
        <RoTip :reason="roReason(d.writable, dbw.b1)"><n-button type="primary" :loading="busy" :disabled="d.writable !== true" @click="post('save', { fields: d.fields })">保存</n-button></RoTip>
      </n-card>
    </template>
    <template v-else-if="d && res === 'switches'">
      <n-card title="功能开关（system.*_switch → /index/init）">
        <div v-for="(_v, k) in d.system" :key="k" style="display:flex;gap:12px;margin-bottom:6px"><n-switch :value="d.system[k] === '1'" @update:value="(x: boolean) => (d.system[k] = x ? '1' : '0')" /><span>{{ fl(String(k)) }} <span class="muted">{{ k }}</span></span></div>
        <div v-for="c in d.config" :key="c.name" style="display:flex;gap:12px;margin-bottom:6px"><n-switch :value="c.value === '1'" @update:value="(x: boolean) => (c.value = x ? '1' : '0')" /><span>{{ c.title || c.name }} <span class="muted">vs_config.{{ c.name }}</span></span></div>
        <RoTip :reason="roReason(d.writable, dbw.b1)"><n-button type="primary" :loading="busy" :disabled="d.writable !== true" @click="post('save', { system: d.system, config: Object.fromEntries(d.config.map((c: any) => [c.name, c.value === '1'])) })">保存</n-button></RoTip>
        <p class="muted">{{ d.legacy }}</p>
      </n-card>
    </template>
    <template v-else-if="d && res === 'integrations'">
      <n-alert type="info">只读。staging 已置空密钥；{{ d.mock }}</n-alert>
      <n-card v-for="x in d.rows" :key="x.name" :title="(x.title || '') + ' · ' + x.name" size="small">
        <n-table size="small"><tbody><tr v-for="(v, k) in x.kv" :key="k"><td style="width:220px">{{ fl(String(k)) }}<br><span class="muted" style="font-size:12px">{{ k }}</span></td><td style="word-break:break-all">{{ maskVal(String(k), v) }}</td></tr></tbody></n-table>
      </n-card>
    </template>
    <template v-else-if="d && isTable">
      <n-space><RoTip :reason="roReason(d.writable, dbw.b1)"><n-button type="primary" :disabled="d.writable !== true" @click="startEdit(null)">新增</n-button></RoTip><n-button @click="load">刷新</n-button></n-space>
      <n-card v-if="edit" :class="{ 'm-sheet': isMobile }" :title="editId ? '编辑 #' + editId : '新增'" size="small">
        <div v-for="c in cols" :key="c" class="b1-f" style="display:flex;gap:8px;margin-bottom:6px;align-items:center"><b style="width:110px" :title="c">{{ fl(c) }}</b>
          <n-select v-if="String(d.cols[c]).startsWith('enum:')" v-model:value="edit[c]" :options="String(d.cols[c]).slice(5).split(',').map((v: string) => ({ label: v, value: v }))" style="max-width:200px" />
          <n-input v-else v-model:value="edit[c]" :type="d.cols[c] === 'long' ? 'textarea' : 'text'" /></div>
        <n-space><n-button type="primary" :loading="busy" @click="post('save', { id: editId, row: edit })">保存</n-button><n-button @click="edit = null">取消</n-button></n-space>
      </n-card>
      <div v-if="isMobile" class="b1-cards" data-mtable>
        <div v-for="r in d.rows" :key="r.id" class="b1-card">
          <div class="b1-h"><b>#{{ r.id }}</b></div>
          <div v-for="c in cols" :key="c" class="b1-r"><span class="muted">{{ fl(c) }}</span><span>{{ r[c] }}</span></div>
          <n-space class="b1-a"><RoTip :reason="roReason(d.writable, dbw.b1)"><n-button size="small" :disabled="d.writable !== true" @click="startEdit(r)">编辑</n-button></RoTip>
            <RoTip :reason="roReason(d.writable, dbw.b1)"><n-popconfirm @positive-click="post('delete', { id: r.id }, '已删除')"><template #trigger><n-button size="small" type="error" ghost :disabled="d.writable !== true">删除</n-button></template>确认删除 #{{ r.id }}？</n-popconfirm></RoTip></n-space>
        </div>
      </div>
      <n-table v-else size="small"><thead><tr><th>id</th><th v-for="c in cols" :key="c" :title="c">{{ fl(c) }}</th><th></th></tr></thead>
        <tbody><tr v-for="r in d.rows" :key="r.id"><td>{{ r.id }}</td><td v-for="c in cols" :key="c" style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ r[c] }}</td>
          <td><n-space><RoTip :reason="roReason(d.writable, dbw.b1)"><n-button size="tiny" :disabled="d.writable !== true" @click="startEdit(r)">编辑</n-button></RoTip>
            <RoTip :reason="roReason(d.writable, dbw.b1)"><n-popconfirm @positive-click="post('delete', { id: r.id }, '已删除')"><template #trigger><n-button size="tiny" type="error" :disabled="d.writable !== true">删除</n-button></template>确认删除 #{{ r.id }}？</n-popconfirm></RoTip></n-space></td></tr></tbody></n-table>
      <n-card v-if="res === 'langs'" title="新语种复制套餐（VIP + 金币套餐，仅当目标语种还没有套餐时）" size="small">
        <n-space><n-select v-model:value="copyFrom" :options="langOpts" placeholder="来源语种" style="width:220px" /><n-select v-model:value="copyTo" :options="langOpts" placeholder="目标语种" style="width:220px" />
          <RoTip :reason="roReason(d.writable, dbw.b1)"><n-button :disabled="d.writable !== true || !copyFrom || !copyTo" :loading="busy" @click="post('lang_copy', { from: copyFrom, to: copyTo }, '已复制')">复制</n-button></RoTip></n-space>
        <p class="muted">H5 “Language → Content language” 列出 /index/lang_list 的语种。</p>
      </n-card>
    </template>
    <n-tag v-if="d" size="small">B1 · {{ res }}</n-tag>
  </n-space>
</template>
<style scoped>
.b1-cards{display:flex;flex-direction:column;gap:10px}
.b1-card{background:#fff;border:1px solid #ECEEF3;border-radius:10px;padding:10px 12px}
.b1-r{display:flex;gap:10px;font-size:13px;padding:3px 0;word-break:break-all}.b1-r .muted{flex:0 0 96px}
.b1-a{margin-top:8px}
@media (max-width:767px){
  .b1-f{flex-direction:column;align-items:stretch!important}.b1-f b{width:auto!important}.b1-f :deep(.n-base-selection),.b1-f :deep(.n-select){max-width:none!important}
  .m-sheet{position:fixed;inset:0;z-index:2000;overflow:auto;border-radius:0}
}
</style>
