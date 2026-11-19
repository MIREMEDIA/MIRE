<script setup lang="ts">
import PageLoading from '../components/PageLoading.vue'
// B4c：金币记录（vs_mire_adjust 按 biz_type 筛选，默认只看 admin 调账）/ 任务配置（vs_dramas_task + vs_dramas_job：只改奖励 usable、每日次数 limit、上下架）/ 签到规则（vs_dramas_config.usersign，与 UserSignService/UserSignProvider 同字段同校验）+ 签到记录。
import { ref, watch } from 'vue'
import { NButton, NInput, NInputNumber, NSelect, NTag, NAlert, NSpace, NPagination, NTable, NTabs, NTabPane, NSwitch, NCard, useMessage } from 'naive-ui'
import { api } from '../api'
import RoTip from '../components/RoTip.vue'
import { dbw, loadDbw, roReason } from '../ro'
loadDbw('b4')   // FE-M6
const props = defineProps<{ page: any; mode: string }>()
const msg = useMessage()
const err = ref(''); const d = ref<any>(null); const busy = ref('')
const BIZ = [{ label: '后台调账 (admin)', value: 'admin' }, { label: '打赏 (tip)', value: 'tip' }, { label: '签到 (signin)', value: 'signin' }, { label: '任务 (task)', value: 'task' }, { label: '分享 (share，不发金币)', value: 'share' }, { label: '奖励 (reward)', value: 'reward' }, { label: '订单支付 (pay)', value: 'pay' }, { label: '分销佣金 (commission)', value: 'commission' }, { label: '全部 (all)', value: 'all' }]
// B4F：标签同时显示中文和英文 biz 代码（如「订单支付 · pay」）
const BIZ_T: Record<string, string> = Object.fromEntries(BIZ.map(x => [x.value, x.label.split(' ')[0] + ' · ' + x.value]))
// B4G：后台加款/扣减分开记账（wallet_log.type），中英文
const LT = [{ label: '全部流水类型 (all)', value: '' }, { label: '后台加款 (admin_recharge)', value: 'admin_recharge' }, { label: '后台扣减 (admin_deduct)', value: 'admin_deduct' }]
const LT_T: Record<string, string> = { admin_recharge: '加款 · admin_recharge', admin_deduct: '扣减 · admin_deduct' }
const WT: Record<string, string> = { usable: '剧场积分 (usable)', score: '积分 (score)', money: '余额 (money)' }
const f = ref({ biz_type: props.mode === 'coin' ? 'tip' : 'admin', user_id: '', log_type: '', page: 1 })
const edit = ref<Record<string, any>>({})
async function load() {
  err.value = ''
  try {
    if (props.mode === 'coin') d.value = await api('b4.coin.records', { ...f.value, size: 20 })
    else if (props.mode === 'signin') { d.value = await api('b4.sign.records', { user_id: f.value.user_id, page: f.value.page, size: 20 }); if (!sr.value) await loadRules() }
    else { d.value = await api('b4.task.list', {}); edit.value = Object.fromEntries([...d.value.task.map((r: any) => ['task' + r.id, { ...r }]), ...d.value.job.map((r: any) => ['job' + r.id, { ...r }])]) }
  } catch (e: any) { err.value = e.message }
}
watch(() => [props.mode, f.value.biz_type, f.value.log_type, f.value.page], load, { immediate: true })
function search() { f.value.page = 1; load() }
async function save(table: string, r: any) {
  const e = edit.value[table + r.id]; busy.value = table + r.id
  const body: any = { table, id: r.id, usable: e.usable, status: e.status }; if (table === 'task') body.limit = e.limit
  try { await api('b4.task.save', {}, body); msg.success('已保存'); await load() } catch (x: any) { msg.error(x.message) } finally { busy.value = '' }
}
// 签到规则：字段与 UserSignProvider::$default 一致；保存后服务端按 full 升序、返回前若干天每日得分预览（同 getSigninScore）
const sr = ref<any>(null); const rf = ref<any>(null)
async function loadRules() { sr.value = await api('b4.sign.rules', {}); rf.value = JSON.parse(JSON.stringify(sr.value.rules)) }
function addDisc() { rf.value.discounts.push({ full: (rf.value.discounts.at(-1)?.full || 0) + 1, value: 0 }) }
async function saveRules() {
  busy.value = 'rules'
  try { const r = await api('b4.sign.rules.save', {}, rf.value); msg.success('签到规则已保存'); sr.value = { ...sr.value, exists: true, rules: r.rules, preview: r.preview }; rf.value = JSON.parse(JSON.stringify(r.rules)) }
  catch (x: any) { msg.error(x.message) } finally { busy.value = '' }
}
const fmt = (t: number | null) => t ? new Date(t * 1000).toLocaleString('zh-CN', { hour12: false }) : ''
const stOpts = [{ label: '上架', value: 'normal' }, { label: '下架', value: 'hidden' }]
</script>
<template>
  <n-space vertical>
    <h2 style="margin:0">{{ page.t }}</h2>
    <n-alert v-if="err" type="error">{{ err }}</n-alert>
    <template v-if="mode === 'coin'">
      <div class="b4-f" data-b4c="coin">
        <n-select v-model:value="f.biz_type" :options="BIZ" style="min-width:150px" />
        <n-select v-if="f.biz_type === 'admin' || f.biz_type === 'all'" v-model:value="f.log_type" :options="LT" style="min-width:170px" />
        <n-input v-model:value="f.user_id" placeholder="用户ID" clearable @keyup.enter="search" />
        <n-button type="primary" @click="search">查询</n-button>
      </div>
      <PageLoading v-if="!d && !err" />
      <n-alert v-if="d && d.migrated === false" type="warning">vs_mire_adjust 还没有 biz_type / uid 列，请先执行 b4c_mire_adjust_biz.sql。</n-alert>
      <p v-if="d" class="muted" style="margin:0">共 {{ d.total }} 条 · 合计变动 {{ d.sum_delta }}<template v-if="d.sum_money && d.sum_money !== '0.00'"> · 余额合计 {{ d.sum_money }}</template> · 打赏扣 usable，每次 1–5 · 分享不发金币</p>
      <n-table v-if="d" size="small"><thead><tr><th>ID</th><th>类型</th><th>用户</th><th>钱包</th><th>变动</th><th>前→后</th><th>操作人</th><th>说明</th><th>时间</th></tr></thead>
        <tbody><tr v-for="r in d.rows" :key="r.id" :data-rid="r.id"><td>{{ r.id }}</td><td><n-tag size="small" :type="r.biz_type === 'admin' ? 'info' : 'default'">{{ BIZ_T[r.biz_type] || r.biz_type }}</n-tag> <n-tag v-if="LT_T[r.log_type]" size="small" :type="r.log_type === 'admin_deduct' ? 'error' : 'success'">{{ LT_T[r.log_type] }}</n-tag></td><td>{{ r.user_id }}</td><td>{{ WT[r.wallet_type] || r.wallet_type }}</td>
          <td :style="{ color: r.delta < 0 ? '#d03050' : '#18a058' }"><template v-if="r.unit === 'cent'">{{ r.delta_text }}</template><template v-else>{{ r.delta > 0 ? '+' : '' }}{{ r.delta }}</template></td><td>{{ r.unit === 'cent' ? r.before_text + ' → ' + r.after_text : r.before + ' → ' + r.after }}</td>
          <td>{{ r.admin_id ? r.admin_name + ' #' + r.admin_id : '用户 ' + (r.uid || r.user_id) }}</td><td>{{ r.reason }}</td><td>{{ fmt(r.createtime) }}</td></tr>
          <tr v-if="!d.rows.length"><td colspan="9" class="muted" style="text-align:center">暂无记录</td></tr></tbody></n-table>
      <n-pagination v-if="d && d.total > 20" v-model:page="f.page" :item-count="d.total" :page-size="20" />
    </template>
    <template v-else-if="mode === 'tasks' && !d && !err"><PageLoading /></template>
    <template v-else-if="mode === 'tasks' && d">
      <n-alert v-if="roReason(d.writable, dbw.b4)" type="warning" data-ro="banner">{{ roReason(d.writable, dbw.b4) }}</n-alert>
      <p class="muted" style="margin:0">只开放奖励金币(usable)、每日次数(limit)、上下架；标题/钩子仍在 FA 后台维护。</p>
      <n-tabs type="line">
        <n-tab-pane name="task" tab="剧场积分任务 (vs_dramas_task)">
          <n-table size="small"><thead><tr><th>ID</th><th>标题</th><th>钩子</th><th>类型</th><th>奖励 usable</th><th>次数</th><th>状态</th><th></th></tr></thead>
            <tbody><tr v-for="r in d.task" :key="r.id" :data-tid="r.id"><td>{{ r.id }}</td><td>{{ r.title }}</td><td>{{ r.hook }}</td><td>{{ r.type === 'day' ? '每日' : '一次' }}</td>
              <td><n-input-number v-model:value="edit['task' + r.id].usable" size="small" :min="0" :max="100000" style="width:100px" /></td>
              <td><n-input-number v-model:value="edit['task' + r.id].limit" size="small" :min="1" :max="1000" style="width:80px" /></td>
              <td><n-select v-model:value="edit['task' + r.id].status" size="small" :options="stOpts" style="width:90px" /></td>
              <td><RoTip :reason="roReason(d.writable, dbw.b4)"><n-button size="small" type="primary" :disabled="d.writable !== true" :loading="busy === 'task' + r.id" @click="save('task', r)">保存</n-button></RoTip></td></tr>
              <tr v-if="!d.task.length"><td colspan="8" class="muted" style="text-align:center">暂无任务</td></tr></tbody></n-table>
        </n-tab-pane>
        <n-tab-pane name="job" tab="新人/每日任务 (vs_dramas_job)">
          <n-table size="small"><thead><tr><th>ID</th><th>标题</th><th>分类</th><th>事件</th><th>奖励 usable</th><th>状态</th><th></th></tr></thead>
            <tbody><tr v-for="r in d.job" :key="r.id" :data-jid="r.id"><td>{{ r.id }}</td><td>{{ r.title }}</td><td>{{ r.category }}</td><td>{{ r.event }}</td>
              <td><n-input-number v-model:value="edit['job' + r.id].usable" size="small" :min="0" :max="100000" style="width:100px" /></td>
              <td><n-select v-model:value="edit['job' + r.id].status" size="small" :options="stOpts" style="width:90px" /></td>
              <td><RoTip :reason="roReason(d.writable, dbw.b4)"><n-button size="small" type="primary" :disabled="d.writable !== true" :loading="busy === 'job' + r.id" @click="save('job', r)">保存</n-button></RoTip></td></tr>
              <tr v-if="!d.job.length"><td colspan="7" class="muted" style="text-align:center">暂无任务</td></tr></tbody></n-table>
        </n-tab-pane>
      </n-tabs>
    </template>
    <template v-else-if="mode === 'signin'">
      <n-card v-if="rf" size="small" title="签到规则" data-b4c="sign-rules">
        <n-alert v-if="roReason(sr.writable, dbw.b4)" type="warning" data-ro="banner">{{ roReason(sr.writable, dbw.b4) }}</n-alert>
        <n-alert v-if="!sr.exists" type="warning">FA 里还没有 usersign 配置（H5 签到会提示 Please configure usersign）。请先在 FA 后台创建，本页不自动新建。</n-alert>
        <div class="b4-sr">
          <label>每日签到金币 everyday<n-input-number v-model:value="rf.everyday" :min="0" :max="100000" size="small" /></label>
          <label>连续递增 is_inc<n-switch v-model:value="rf.is_inc" :checked-value="1" :unchecked-value="0" /></label>
          <label>每天递增 inc_num<n-input-number v-model:value="rf.inc_num" :min="0" :max="100000" size="small" :disabled="!rf.is_inc" /></label>
          <label>递增持续天数 until_day<n-input-number v-model:value="rf.until_day" :min="0" :max="365" size="small" :disabled="!rf.is_inc" /></label>
          <label>开启补签 is_replenish<n-switch v-model:value="rf.is_replenish" :checked-value="1" :unchecked-value="0" /></label>
          <label>可补签天数 replenish_days<n-input-number v-model:value="rf.replenish_days" :min="1" :max="365" size="small" :disabled="!rf.is_replenish" /></label>
          <label>补签期限(天，0=不限) replenish_limit<n-input-number v-model:value="rf.replenish_limit" :min="0" :max="365" size="small" :disabled="!rf.is_replenish" /></label>
          <label>补签扣金币 replenish_num<n-input-number v-model:value="rf.replenish_num" :min="1" :max="100000" size="small" :disabled="!rf.is_replenish" /></label>
        </div>
        <p class="muted" style="margin:8px 0 4px">连续签到奖励 discounts（连续第 N 天额外加；FA 签到按此表计算，is_discounts 开关 FA 不读取）<n-switch v-model:value="rf.is_discounts" :checked-value="1" :unchecked-value="0" size="small" style="margin-left:6px" /></p>
        <div v-for="(x, i) in rf.discounts" :key="i" class="b4-f" :data-disc="i">第<n-input-number v-model:value="x.full" :min="1" :max="365" size="small" style="width:90px" />天 +<n-input-number v-model:value="x.value" :min="0" :max="100000" size="small" style="width:110px" /><n-button size="small" @click="rf.discounts.splice(i, 1)">删除</n-button></div>
        <n-space style="margin-top:6px"><n-button size="small" @click="addDisc">添加连续奖励</n-button><RoTip :reason="roReason(sr.writable, dbw.b4)"><n-button type="primary" size="small" :disabled="sr.writable !== true || !sr.exists" :loading="busy === 'rules'" @click="saveRules">保存规则</n-button></RoTip></n-space>
        <p v-if="sr.preview" class="muted" style="margin:8px 0 0" data-b4c="sign-preview">已保存规则下连续第 N 天得分：<span v-for="p in sr.preview" :key="p.day" style="margin-right:8px">{{ p.day }}天 {{ p.score }}</span></p>
      </n-card>
      <div class="b4-f"><n-input v-model:value="f.user_id" placeholder="用户ID" clearable @keyup.enter="search" /><n-button type="primary" @click="search">查询</n-button></div>
      <PageLoading v-if="!d && !err" />
      <n-table v-if="d" size="small"><thead><tr><th>ID</th><th>用户</th><th>日期</th><th>得分</th><th>补签</th><th>时间</th></tr></thead>
        <tbody><tr v-for="r in d.rows" :key="r.id"><td>{{ r.id }}</td><td>{{ r.user_id }}</td><td>{{ r.date }}</td><td>{{ r.score }}</td><td>{{ +r.is_replenish ? '是' : '' }}</td><td>{{ fmt(+r.createtime) }}</td></tr>
          <tr v-if="!d.rows.length"><td colspan="6" class="muted" style="text-align:center">暂无签到</td></tr></tbody></n-table>
      <n-pagination v-if="d && d.total > 20" v-model:page="f.page" :item-count="d.total" :page-size="20" />
    </template>
  </n-space>
</template>
<style scoped>
.b4-sr{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px 16px}
.b4-sr label{display:flex;flex-direction:column;gap:4px;font-size:13px;color:#555}
[data-disc]{display:flex;align-items:center;gap:6px;margin:4px 0}
@media (max-width:767px){ .b4-sr{grid-template-columns:1fr 1fr} .b4-sr :deep(.n-button), [data-disc] :deep(.n-button){min-height:44px} }
</style>
