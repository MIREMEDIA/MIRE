<script setup lang="ts">
import PageLoading from '../components/PageLoading.vue'
// B4a row 22：评论后台（只对齐 FA 原字段）。列表 / 审核(status normal↔hidden) / 置顶(weigh) / 软删除(deletetime) / 恢复。
// 写入只在 API 连的是 staging 库且 write_enabled 时被接受（api/b4.php → wq() → write_guard）。
import { ref, watch } from 'vue'
import { NButton, NInput, NInputNumber, NSelect, NTag, NAlert, NSpace, NPopconfirm, NPagination, NTable, useMessage } from 'naive-ui'
import { api } from '../api'
import { isMobile } from '../mobile'
import RoTip from '../components/RoTip.vue'
import { dbw, loadDbw, roReason } from '../ro'
import { computed } from 'vue'
loadDbw('b4')   // FE-M6：b4.status.db_writable 用来区分「库不可写」与「无权限」
defineProps<{ page: any }>()
const msg = useMessage()
const d = ref<any>(null); const err = ref(''); const busy = ref(0)
const f = ref({ kw: '', vid: '', status: '', deleted: '0', page: 1 })
const stOpts = [{ label: '全部状态', value: '' }, { label: '显示', value: 'normal' }, { label: '隐藏', value: 'hidden' }]
const delOpts = [{ label: '未删除', value: '0' }, { label: '已删除', value: '1' }, { label: '全部', value: 'all' }]
const weighEdit = ref<Record<number, number | null>>({})
async function load() {
  err.value = ''
  try { d.value = await api('b4.comments.list', { ...f.value, size: 20 }); weighEdit.value = Object.fromEntries(d.value.rows.map((r: any) => [r.id, r.weigh ?? 0])) }
  catch (e: any) { err.value = e.message }
}
watch(() => [f.value.status, f.value.deleted, f.value.page], load, { immediate: true })
function search() { f.value.page = 1; load() }
async function act(a: string, body: any, ok: string) {
  busy.value = body.id
  try { await api('b4.comments.' + a, {}, body); msg.success(ok); await load() } catch (e: any) { msg.error(e.message) } finally { busy.value = 0 }
}
// FE-M6：写按钮一律渲染（置灰），原因只按后端字段：comments.list.writable（adm.comment）+ b4.status.db_writable
const roC = computed(() => roReason(d.value?.writable, dbw.b4))
const fmt = (t: number | null) => t ? new Date(t * 1000).toLocaleString('zh-CN', { hour12: false }) : ''
</script>
<template>
  <n-space vertical>
    <h2 style="margin:0">{{ page.t }}</h2>
    <n-alert v-if="err" type="error">{{ err }}</n-alert>
    <n-alert v-if="roC" type="warning" data-ro="banner">{{ roC }}</n-alert>
    <div class="b4-f">
      <n-input v-model:value="f.kw" placeholder="评论ID / 内容" clearable @keyup.enter="search" />
      <n-input v-model:value="f.vid" placeholder="短剧ID" clearable @keyup.enter="search" />
      <n-select v-model:value="f.status" :options="stOpts" />
      <n-select v-model:value="f.deleted" :options="delOpts" />
      <n-button type="primary" @click="search">查询</n-button>
    </div>
    <PageLoading v-if="!d && !err" />
    <p v-if="d" class="muted" style="margin:0">共 {{ d.total }} 条 · 排序：置顶权重(weigh)高的在前，再按时间倒序 · 隐藏/删除后 H5 不再显示</p>
    <div v-if="d && isMobile" class="b4-cards" data-mtable>
      <div v-for="r in d.rows" :key="r.id" class="b4-card" :class="{ del: r.deletetime }" :data-cid="r.id">
        <div class="b4-h"><b>#{{ r.id }}</b><n-tag size="small" :type="r.status === 'normal' ? 'success' : 'default'">{{ r.status === 'normal' ? '显示' : '隐藏' }}</n-tag>
          <n-tag v-if="r.weigh > 0" size="small" type="warning">置顶 {{ r.weigh }}</n-tag><n-tag v-if="r.deletetime" size="small" type="error">已删除</n-tag></div>
        <div class="b4-c">{{ r.content }}</div>
        <div class="muted b4-m">剧 {{ r.vid }} · {{ r.pid ? '回复 #' + r.pid : '一级评论' + (r.replies ? ' · ' + r.replies + ' 条回复' : '') }} · {{ r.nickname || ('用户 ' + r.user_id) }} · 赞 {{ r.likes ?? 0 }} · {{ fmt(r.createtime) }}</div>
        <div class="b4-a">
          <template v-if="!r.deletetime">
            <RoTip :reason="roC"><n-button size="small" :disabled="d.writable !== true" :loading="busy === r.id" @click="act('save', { id: r.id, status: r.status === 'normal' ? 'hidden' : 'normal' }, r.status === 'normal' ? '已隐藏' : '已显示')">{{ r.status === 'normal' ? '隐藏' : '显示' }}</n-button></RoTip>
            <n-input-number v-model:value="weighEdit[r.id]" size="small" :min="0" :max="999999" :show-button="false" placeholder="权重" style="width:84px" :disabled="d.writable !== true" data-b4="weigh" />
            <RoTip :reason="roC"><n-button size="small" :disabled="d.writable !== true" @click="act('save', { id: r.id, weigh: weighEdit[r.id] ?? 0 }, '已保存权重')">置顶权重</n-button></RoTip>
            <RoTip :reason="roC"><n-popconfirm @positive-click="act('delete', { id: r.id }, '已删除')"><template #trigger><n-button size="small" type="error" ghost :disabled="d.writable !== true">删除</n-button></template>软删除 #{{ r.id }}？（写 deletetime，可恢复）</n-popconfirm></RoTip>
          </template>
          <RoTip v-else :reason="roC"><n-button size="small" :disabled="d.writable !== true" @click="act('restore', { id: r.id }, '已恢复')">恢复</n-button></RoTip>
        </div>
      </div>
      <div v-if="!d.rows.length" class="muted" style="text-align:center;padding:24px" data-b4="empty">暂无评论（当前筛选下 0 条；隐藏/显示/置顶/删除按钮按行显示）</div>
    </div>
    <n-table v-else-if="d" size="small"><thead><tr><th>ID</th><th>短剧</th><th>层级</th><th>用户</th><th>内容</th><th>赞</th><th>状态</th><th>权重</th><th>时间</th><th></th></tr></thead>
      <tbody><tr v-for="r in d.rows" :key="r.id" :class="{ del: r.deletetime }" :data-cid="r.id"><td>{{ r.id }}</td><td>{{ r.vid }}</td><td>{{ r.pid ? '回复 #' + r.pid : '一级 (' + r.replies + ')' }}</td><td>{{ r.nickname || r.user_id }}</td>
        <td style="max-width:280px;word-break:break-all">{{ r.content }}</td><td>{{ r.likes ?? 0 }}</td>
        <td><n-tag size="small" :type="r.status === 'normal' ? 'success' : 'default'">{{ r.status === 'normal' ? '显示' : '隐藏' }}</n-tag><n-tag v-if="r.deletetime" size="small" type="error">已删除</n-tag></td>
        <td><n-input-number v-model:value="weighEdit[r.id]" size="tiny" :min="0" :max="999999" :show-button="false" style="width:72px" :disabled="d.writable !== true || !!r.deletetime" data-b4="weigh" /></td><td>{{ fmt(r.createtime) }}</td>
        <td><n-space v-if="!r.deletetime" size="small">
          <RoTip :reason="roC"><n-button size="tiny" :disabled="d.writable !== true" @click="act('save', { id: r.id, status: r.status === 'normal' ? 'hidden' : 'normal' }, '已保存')">{{ r.status === 'normal' ? '隐藏' : '显示' }}</n-button></RoTip>
          <RoTip :reason="roC"><n-button size="tiny" :disabled="d.writable !== true" @click="act('save', { id: r.id, weigh: weighEdit[r.id] ?? 0 }, '已保存权重')">存权重</n-button></RoTip>
          <RoTip :reason="roC"><n-popconfirm @positive-click="act('delete', { id: r.id }, '已删除')"><template #trigger><n-button size="tiny" type="error" :disabled="d.writable !== true">删除</n-button></template>软删除 #{{ r.id }}？</n-popconfirm></RoTip></n-space>
          <RoTip v-else :reason="roC"><n-button size="tiny" :disabled="d.writable !== true" @click="act('restore', { id: r.id }, '已恢复')">恢复</n-button></RoTip></td></tr><tr v-if="!d.rows.length"><td colspan="10" class="muted" style="text-align:center;padding:24px" data-b4="empty">暂无评论（当前筛选下 0 条；隐藏/显示/置顶/删除按钮按行显示）</td></tr></tbody></n-table>
    <n-pagination v-if="d && d.total > d.size" v-model:page="f.page" :page-count="Math.ceil(d.total / d.size)" :page-slot="5" />
    <n-tag v-if="d" size="small">B4 · comments</n-tag>
  </n-space>
</template>
<style scoped>
.b4-f{display:grid;grid-template-columns:1fr 120px 120px 110px auto;gap:8px}
.b4-cards{display:flex;flex-direction:column;gap:10px}
.b4-card{background:#fff;border:1px solid #ECEEF3;border-radius:10px;padding:10px 12px}.b4-card.del{opacity:.6}
.b4-h{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.b4-c{margin:6px 0;font-size:14px;word-break:break-all}.b4-m{font-size:12px}
.b4-a{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;align-items:center}
tr.del td{opacity:.55}
@media (max-width:767px){ .b4-f{grid-template-columns:1fr 1fr} .b4-f :deep(.n-button){min-height:44px} .b4-a :deep(.n-button){min-height:44px} }
</style>
