<script setup lang="ts">
// B10 #1 短剧模块 CRUD（b10.meta/list/get/save/delete/refund/wallet.*）。字段定义来自服务端 b10.meta，校验也只在服务端做一次。
// 权限：服务端 adm_enforce 是闸门（role=none / 缺节点 -> 403）；这里按 adm.me 提前禁用按钮并显示提示，收到 403 也显示同一提示。
import { computed, h, ref, watch } from 'vue'
import { NAlert, NButton, NDropdown, NInput, NModal, NPopconfirm, NSelect, NTag, useMessage } from 'naive-ui'
import { isMobile } from '../../mobile'
import { fl, maskName } from '../../fieldLabels'
import { api } from '../../api'
import { t, fmtTime } from '../../b8i18n'
import '../../b10i18n'
import { admCan, loadAdm } from '../../adm'
import MTable from '../../components/MTable.vue'
import B8Bar from '../b8/B8Bar.vue'
import RoTip from '../../components/RoTip.vue'
import { roReason } from '../../ro'
import '../b8/b8.css'
const props = defineProps<{ page: any; res: string }>()
const msg = useMessage()
const meta = ref<any>(null); const d = ref<any>(null); const err = ref(''); const forb = ref(''); const busy = ref('')
const f = ref<Record<string, any>>({ kw: '', page: 1 })
const m = computed(() => meta.value?.res?.[props.res])
// FE-M6：页面写权限只认后端 writable_res（含 db_writable 与节点权限），不再前端拼 adm.perms
// FE-M6（B21.4.1 口径）：按资源判断——b10.meta.writable_res[res]，其次 b10.list 返回的 writable；不用 meta.writable（模块汇总值）
const resW = computed<boolean | undefined>(() => { const w = meta.value?.writable_res?.[props.res]; if (typeof w === 'boolean') return w; const l = d.value?.writable; return typeof l === 'boolean' ? l : undefined })
const canW = computed(() => resW.value === true)
const roW = computed(() => roReason(resW.value, meta.value?.db_writable))
// FE-M7：订单 can_refund（b10.php order 行，布尔）=false → 退款按钮置灰；只读原因优先，其次后端原因字段，最后默认文案
const refundWhy = (r: any) => roW.value || (r.can_refund === false ? (r.refund_reason_text || r.can_refund_reason || r.no_refund_reason || t('b10.refund.no')) : '')
// FE-M8：禁用时不再用 warning（半透明橙），回到 Naive UI 默认禁用灰
const refundOff = (r: any) => !canW.value || !admCan('adm.refund') || !r.can_refund
const hasCR = (r: any) => isOrder.value && typeof r.can_refund === 'boolean'
const RT = (reason: string, vn: any) => h(RoTip, { reason }, () => vn)
const isOrder = computed(() => !!m.value?.order)
function fail(e: any) { if (e?.code === 403) { forb.value = e.message; msg.error(t('b10.forbidden', { m: e.message })) } else msg.error(e.message) }
// B18 #3「点两次查询、约 5 秒才出数据」：原 load() 串行 loadAdm → b10.meta（逐表查 INFORMATION_SCHEMA）→ b10.list，
// 且 search() 在 page≠1 时会被 page watcher 再触发一次、两次请求无序返回，旧响应可能覆盖新结果。现在：
//   ① meta 模块级缓存（同一会话只拉一次），与 loadAdm、list 并行；② 请求序号守卫，只采用最后一次请求的结果；
//   ③ search() 只在页码不变时自己 load，否则交给 page watcher（只发一次）；④ 300ms 内重复点击合并。
let metaP: Promise<any> | null = null
let seq = 0
const loading = ref(false)
async function load() {
  const my = ++seq
  err.value = ''; loading.value = true
  try {
    if (!metaP) metaP = api('b10.meta').catch((e: any) => { metaP = null; throw e })
    const [, , list] = await Promise.all([loadAdm(), metaP.then((x: any) => { meta.value = x }), api('b10.list', { res: props.res, kw: f.value.kw, page: f.value.page, size: 20 })])
    if (my !== seq) return
    d.value = list
  } catch (e: any) { if (my !== seq) return; err.value = e.message; if (e.code === 403) forb.value = e.message }
  finally { if (my === seq) loading.value = false }
}
watch(() => props.res, () => { d.value = null; forb.value = ''; f.value = { kw: '', page: 1 }; load() }, { immediate: true })
watch(() => f.value.page, (n, o) => { if (n !== o) load() })
let lastSearch = 0
const search = () => {
  const now = Date.now(); if (now - lastSearch < 300) return; lastSearch = now
  if (f.value.page !== 1) f.value.page = 1   // page watcher 会 load 一次
  else load()
}
// ---- 编辑 ----
const ed = ref<Record<string, any> | null>(null); const edId = ref(0); const wlog = ref<any[]>([])
async function open(r?: any) {
  wlog.value = []
  if (r) { try { const x: any = await api('b10.get', { res: props.res, id: r.id }); wlog.value = x.wallet_log || []; r = x } catch (e: any) { return fail(e) } }
  edId.value = r ? +r.id : 0
  badVal.value = {}; missReq.value = []
  ed.value = Object.fromEntries((m.value?.fields || []).map((x: any) => [x.k, x.type === 'pw' ? '' : r ? (x.type === 'ts' && +r[x.k] ? new Date(+r[x.k] * 1000).toISOString().slice(0, 16).replace('T', ' ') : String(r[x.k] ?? '')) : (x.opts ? x.opts[0] : '')]))
  edOrig.value = { ...(ed.value || {}) }
}
// B16：价格低于 Stripe 最低金额 → 表单内即时提示 + 保存时服务端返回 need_confirm → 确认弹窗 → 带 ack_low_price 重发（价格原样保存，不自动改）
const PKG = ['vip_pkg', 'pts_pkg', 'p_vip', 'p_pts']
const lowWarn = computed(() => {
  if (!ed.value || !PKG.includes(props.res) || !meta.value?.stripe_min) return []
  const cur = meta.value.lang_currency?.[+ed.value.lang_id] || 'USD'; const min = +meta.value.stripe_min[cur]
  if (!(min > 0)) return []
  return (m.value?.fields || []).filter((x: any) => ['price', 'first_price'].includes(x.k)).flatMap((x: any) => {
    const v = +ed.value![x.k]; return v > 0 && Math.round(v * 100) < Math.round(min * 100) ? [{ field: x.k, label: x.t, value: v.toFixed(2), currency: cur, min: meta.value.stripe_min[cur] }] : [] })
})
const lowConfirm = ref<any[] | null>(null)
// FE-M1 QA-R1-8：这些字段在库里是 NOT NULL，服务端 meta 没标 req；前端补必填标记和校验（不改后端）
// FE-M4：VIP 套餐语种必填（QA-R2：可保存出无语种套餐，H5 按语种取套餐会漏显）
const FE_REQ: Record<string, string[]> = { vip_pkg: ['original_price', 'lang_id'], p_vip: ['original_price', 'lang_id'] }
const isReq = (x: any) => !!x.req || (FE_REQ[props.res] || []).includes(x.k)
const missReq = ref<string[]>([])
const blank = (k: string, v: any) => v === null || v === undefined || String(v).trim() === '' || (k === 'lang_id' && String(v).trim() === '0')
// FE-M4：套餐价格前端校验——必须是正数、最多两位小数（后端 money 规则允许 0，见 fe_audit/m4/backend_validation.md）
const MONEY = /^\d{1,8}(\.\d{1,2})?$/
const badVal = ref<Record<string, string>>({})
// FE-M5（B21.3 #4）：与后端一致——首充价留空 = 无首充优惠（存 NULL）；显式 0 拒绝；编辑时原值未改的历史 0 后端放行，前端同样放行
const edOrig = ref<Record<string, any>>({})
const VIPR = ['vip_pkg', 'p_vip']
function checkPrices(): Record<string, string> {
  const e: Record<string, string> = {}
  if (!ed.value || !PKG.includes(props.res)) return e
  for (const x of (m.value?.fields || []) as any[]) {
    if (x.type !== 'money' && !['price', 'first_price', 'original_price', 'give_price'].includes(x.k)) continue
    const v = String(ed.value[x.k] ?? '').trim(); if (v === '') continue   // 空值交给必填校验 / 不发送
    const o = String(edOrig.value[x.k] ?? '').trim()
    if (edId.value && o !== '' && MONEY.test(v) && Math.round(+o * 100) === Math.round(+v * 100)) continue
    if (x.k === 'first_price' && MONEY.test(v) && +v === 0) { e[x.k] = fl(x.k, x.t) + ' 不能填 0；留空表示没有首充优惠'; continue }
    if (!MONEY.test(v) || !(+v > 0)) e[x.k] = fl(x.k, x.t) + ' 必须是大于 0 的数字，最多两位小数'
  }
  return e
}
async function save(ack = false) {
  if (!ed.value) return
  missReq.value = (m.value?.fields || []).filter((x: any) => isReq(x) && x.type !== 'pw' && blank(x.k, ed.value![x.k])).map((x: any) => x.k)
  if (missReq.value.length) { msg.error('请填写必填项：' + (m.value.fields as any[]).filter(x => missReq.value.includes(x.k)).map(x => fl(x.k, x.t)).join('、')); return }
  badVal.value = checkPrices()
  if (Object.keys(badVal.value).length) { msg.error(Object.values(badVal.value).join('；')); return }
  const data: Record<string, any> = { ...ed.value }
  for (const x of m.value.fields) if (x.type === 'pw' && !data[x.k]) delete data[x.k]
  // FE-M4：套餐首充价/原价/赠送价留空——新增时不发该字段（交给列默认值，不发 0.00 也不发 null：后端 b10_val 会把 null 转成 '0.00'）；
  // 编辑时发 ''（后端 B18.1：可空列写 NULL，NOT NULL 列保留原值）
  if (PKG.includes(props.res)) for (const k of ['first_price', 'original_price', 'give_price']) if (k in data && String(data[k] ?? '').trim() === '') { if (edId.value) data[k] = ''; else delete data[k] }
  busy.value = 'save'
  try { const x: any = await api('b10.save', {}, { res: props.res, id: edId.value || undefined, data, ...(ack ? { ack_low_price: true } : {}) })
    if (x?.need_confirm) { lowConfirm.value = x.warnings || []; return }
    lowConfirm.value = null; msg.success(t('b10.saved')); ed.value = null; await load() } catch (e: any) { fail(e) } finally { busy.value = '' }
}
// FE-M1 A-S1：手机端卡片把退款/删除收进「更多」菜单；删除走单独的二次确认弹窗（退款本身已有填写原因的确认弹窗）
const delAsk = ref<any>(null)
async function del(r: any) { busy.value = 'del' + r.id; try { await api('b10.delete', {}, { res: props.res, id: r.id }); msg.success(t('b10.deleted')); await load() } catch (e: any) { fail(e) } finally { busy.value = '' } }
// ---- 退款（模拟，幂等）----
const rf = ref<any>(null)
async function refund() {
  busy.value = 'refund'
  try { const x: any = await api('b10.refund', {}, { type: m.value.order, id: rf.value.id, reason: rf.value.reason }); msg.success(x.replay ? t('b10.refund.replay') : t('b10.refunded')); rf.value = null; await load() } catch (e: any) { fail(e) } finally { busy.value = '' }
}
// ---- 调账（幂等 token + 上限 + 不得为负）----
const aj = ref<any>(null)
async function openAdjust(r: any) { try { const x: any = await api('b10.wallet.token', {}, {}); aj.value = { user_id: r.id, wallet_type: 'usable', delta: '', reason: '', form_token: x.token } } catch (e: any) { fail(e) } }
async function adjust() {
  busy.value = 'adjust'
  try { const x: any = await api('b10.wallet.adjust', {}, aj.value); const w = aj.value.wallet_type
    msg.success(x.replay ? t('b10.adjust.replay') : t('b10.adjust.ok', { b: '', a: x.user?.[w] })); aj.value = null; await load() } catch (e: any) { fail(e) } finally { busy.value = '' }
}
// ---- 列 ----
const show = computed(() => (m.value?.fields || []).filter((x: any) => !['pw', 'url'].includes(x.type) && !['description', 'desc', 'content'].includes(x.k)).slice(0, 7))
// B19：语种列显示语种名（meta.lang_names：id => 名称），不再显示数字 id
const langName = (v: any) => { const n = meta.value?.lang_names?.[+v]; return n ? n : (v === null || v === undefined || v === '' || +v === 0 ? '—' : String(v)) }
const langOpts = computed(() => Object.entries(meta.value?.lang_names || {}).map(([id, n]) => ({ label: String(n), value: String(id) })))
const cell = (r: any, x: any) => x.type === 'ts' ? fmtTime(r[x.k]) : x.k === 'lang_id' ? langName(r[x.k]) : x.k === 'first_price' && VIPR.includes(props.res) && (r[x.k] === null || r[x.k] === undefined || r[x.k] === '') ? '无首充价' : String(r[x.k] ?? '')
const cols = () => {
  const c: any[] = [{ title: 'ID', key: 'id', width: 70 }]
  // FE-M1：列名中文；用户昵称/姓名脱敏显示（编辑弹窗与接口数据不变）
  if (isOrder.value) c.push({ title: fl('order_sn'), key: 'order_sn' }, { title: fl('user'), key: 'user_id', render: (r: any) => `#${r.user_id} ${maskName(r.user_nickname)}` }, { title: fl('pkg'), key: 'package_title' },
    { title: fl('amount'), key: 'pay_fee', render: (r: any) => r.pay_fee ?? r.total_fee ?? r.price ?? '' }, { title: t('b8.status'), key: 'status', render: (r: any) => r.refund ? h(NTag, { size: 'small', type: 'warning' }, () => t('b10.refunded')) : String(r.status) })
  else if (props.res === 'wallet') c.push(...['user_id', 'wallet_type', 'type', 'wallet', 'before', 'after', 'oper_type'].map(k => ({ title: fl(k), key: k })), { title: t('b8.time'), key: 'createtime', render: (r: any) => fmtTime(r.createtime) })
  else if (props.res === 'member') c.push(...['username', 'nickname', 'email', 'mobile', 'usable', 'money', 'status'].map(k => ({ title: fl(k), key: k, ...(k === 'nickname' || k === 'username' ? { render: (r: any) => maskName(r[k]) } : {}) })))
  for (const x of show.value) if (!c.some(y => y.key === x.k)) c.push({ title: fl(x.k, x.t), key: x.k, render: (r: any) => cell(r, x) })
  const more = (r: any) => {
    const o: any[] = []
    if (hasCR(r)) o.push({ key: 'refund', label: r.can_refund ? t('b10.refund') : t('b10.refund') + '（' + refundWhy(r) + '）', disabled: !canW.value || !admCan('adm.refund') || !r.can_refund })
    if (m.value?.delete) o.push({ key: 'del', label: t('b10.del'), disabled: !canW.value })
    return o
  }
  const onMore = (k: string, r: any) => { if (k === 'refund') rf.value = { id: r.id, reason: '' }; else if (k === 'del') delAsk.value = r }
  if (isMobile.value) c.push({ title: t('b10.op'), key: 'op', render: (r: any) => h('div', { class: 'b8-row' }, [
    RT(roW.value, h(NButton, { size: 'small', disabled: !canW.value, 'data-b10': 'edit', onClick: () => open(r) }, () => isOrder.value ? t('b10.remark') : t('b10.edit'))),
    props.res === 'member' ? RT(roW.value, h(NButton, { size: 'small', disabled: !canW.value || !admCan('adm.wallet'), 'data-b10': 'adjust', onClick: () => openAdjust(r) }, () => t('b10.adjust'))) : null,
    more(r).length ? h(NDropdown, { trigger: 'click', options: more(r), onSelect: (k: string) => onMore(k, r) }, () => h(NButton, { size: 'small', 'data-b10': 'more', loading: busy.value === 'del' + r.id }, () => '更多 ▾')) : null]) })
  else c.push({ title: t('b10.op'), key: 'op', render: (r: any) => h('div', { class: 'b8-row' }, [
    RT(roW.value, h(NButton, { size: 'small', disabled: !canW.value, 'data-b10': 'edit', onClick: () => open(r) }, () => isOrder.value ? t('b10.remark') : t('b10.edit'))),
    props.res === 'member' ? RT(roW.value, h(NButton, { size: 'small', disabled: !canW.value || !admCan('adm.wallet'), 'data-b10': 'adjust', onClick: () => openAdjust(r) }, () => t('b10.adjust'))) : null,
    hasCR(r) ? RT(refundWhy(r), h(NButton, { size: 'small', type: refundOff(r) ? 'default' : 'warning', disabled: refundOff(r), 'data-b10': 'refund', onClick: () => (rf.value = { id: r.id, reason: '' }) }, () => t('b10.refund'))) : null,
    m.value?.delete ? RT(roW.value, h(NPopconfirm, { onPositiveClick: () => del(r) }, { trigger: () => h(NButton, { size: 'small', type: 'error', disabled: !canW.value, loading: busy.value === 'del' + r.id, 'data-b10': 'del' }, () => t('b10.del')), default: () => t('b10.confirm_del', { id: r.id }) })) : null]) })
  return c
}
</script>
<template>
  <div class="b8" :data-b10="res">
    <B8Bar :title="m?.title || page.t" :writable="resW" :reason="roW" :hint="t('b10.h5')" />
    <n-alert v-if="forb" type="error" data-b10="forbidden" style="margin-bottom:8px">{{ t('b10.forbidden', { m: forb }) }}</n-alert>
    <n-alert v-if="m && !m.exists" type="error">{{ t('b10.missing', { t: m.table }) }}</n-alert>
    <n-alert v-if="isOrder && meta && !meta.refund_table" type="info" style="margin-bottom:8px">{{ t('b10.refund.notable') }}</n-alert>
    <n-alert v-if="err" type="error">{{ err }}</n-alert>
    <div class="b8-f">
      <n-input v-model:value="f.kw" :placeholder="t('b10.kw')" clearable data-b10="kw" @keyup.enter="search" />
      <n-button type="primary" :loading="loading" data-b10="search" @click="search">{{ t('b8.search') }}</n-button>
      <RoTip v-if="m?.create" :reason="roW"><n-button :disabled="!canW" data-b10="add" @click="open()">{{ t('b10.add') }}</n-button></RoTip>
    </div>
    <p v-if="d" class="muted" style="margin:6px 0">{{ t('b10.total', { n: loading ? '—' : d.total }) }}</p>
    <MTable :loading="loading || !d" :columns="cols()" :data="d?.rows || []" remote size="small" :scroll-x="1100" :row-key="(r: any) => r.id" :pagination="{ page: f.page, pageSize: 20, itemCount: d?.total || 0, onUpdatePage: (p: number) => (f.page = p) }" />
    <n-modal :show="!!ed" preset="card" style="width:min(640px,96vw)" :title="edId ? t('b10.edit') + ' #' + edId : t('b10.add')" @update:show="(v: boolean) => !v && (ed = null)">
      <div v-if="ed" class="b8-grid" data-b10="form">
        <label v-for="x in m.fields" :key="x.k" :title="x.k">{{ fl(x.k, x.t) }}<span v-if="isReq(x)" style="color:#d03050" :data-req="x.k">*</span>
          <n-select v-if="x.k === 'lang_id' && langOpts.length" v-model:value="ed[x.k]" size="small" :clearable="!isReq(x)" :options="langOpts" :status="missReq.includes(x.k) || badVal[x.k] ? 'error' : undefined" @update:value="missReq = missReq.filter(k => k !== x.k); delete badVal[x.k]" :data-b10="'f-' + x.k" />
          <n-select v-else-if="x.opts" v-model:value="ed[x.k]" size="small" :options="x.opts.map((o: string) => ({ label: o, value: o }))" :data-b10="'f-' + x.k" />
          <n-input v-else v-model:value="ed[x.k]" size="small" :type="x.type === 'pw' ? 'password' : 'text'" :status="missReq.includes(x.k) ? 'error' : undefined" @update:value="missReq = missReq.filter(k => k !== x.k)" :data-b10="'f-' + x.k" :placeholder="x.type === 'ts' ? 'YYYY-MM-DD HH:mm' : x.k === 'first_price' && VIPR.includes(res) ? '留空 = 无首充价' : x.type" />
          <small v-if="badVal[x.k]" class="b10-err" :data-b10-err="x.k">{{ badVal[x.k] }}</small>
          <small v-else-if="missReq.includes(x.k)" class="b10-err" :data-b10-err="x.k">必填</small>
        </label>
      </div>
      <n-alert v-for="w in lowWarn" :key="w.field" type="warning" data-b16="low-inline" style="margin-top:8px">{{ t('b16.low.inline', { f: w.label, c: w.currency, v: w.value, m: w.min }) }}</n-alert>
      <div v-if="wlog.length" style="margin-top:10px"><b>{{ t('b10.wallet_log') }}</b>
        <div v-for="w in wlog" :key="w.id" class="muted" style="font-size:12px">#{{ w.id }} {{ w.wallet_type }} {{ w.wallet }} ({{ w.before }} → {{ w.after }}) {{ w.memo }} {{ fmtTime(w.createtime) }}</div></div>
      <div class="b8-row" style="justify-content:flex-end;margin-top:12px"><n-button @click="ed = null">{{ t('b10.cancel') }}</n-button><RoTip :reason="roW"><n-button type="primary" :disabled="!canW" :loading="busy === 'save'" data-b10="save" @click="save()">{{ t('b10.save') }}</n-button></RoTip></div>
    </n-modal>
    <n-modal :show="!!lowConfirm" preset="card" style="width:min(480px,96vw)" :title="t('b16.low.title')" data-b16="low-confirm" @update:show="(v: boolean) => !v && (lowConfirm = null)">
      <template v-if="lowConfirm"><p style="margin-top:0">{{ t('b16.low.body') }}</p>
        <ul data-b16="low-list"><li v-for="w in lowConfirm" :key="w.field">{{ t('b16.low.inline', { f: w.label, c: w.currency, v: w.value, m: w.min }) }}</li></ul>
        <p class="muted" style="font-size:12px">{{ t('b16.low.hint') }}</p>
        <div class="b8-row" style="justify-content:flex-end;margin-top:12px"><n-button data-b16="low-cancel" @click="lowConfirm = null">{{ t('b10.cancel') }}</n-button><n-button type="warning" :loading="busy === 'save'" data-b16="low-ok" @click="save(true)">{{ t('b16.low.ok') }}</n-button></div></template>
    </n-modal>
    <n-modal :show="!!rf" preset="card" style="width:min(480px,96vw)" :title="rf ? t('b10.refund.title', { id: rf.id }) : ''" @update:show="(v: boolean) => !v && (rf = null)">
      <template v-if="rf"><p class="muted" style="margin-top:0;font-size:13px">{{ t('b10.refund.hint') }}</p>
        <n-input v-model:value="rf.reason" type="textarea" maxlength="200" :placeholder="t('b10.refund.reason')" data-b10="refund-reason" />
        <div class="b8-row" style="justify-content:flex-end;margin-top:12px"><n-button @click="rf = null">{{ t('b10.cancel') }}</n-button><n-button type="warning" :disabled="!rf.reason.trim()" :loading="busy === 'refund'" data-b10="refund-ok" @click="refund">{{ t('b10.refund') }}</n-button></div></template>
    </n-modal>
    <n-modal :show="!!delAsk" preset="card" style="width:min(420px,96vw)" :title="t('b10.del')" data-b10="del-confirm" @update:show="(v: boolean) => !v && (delAsk = null)">
      <template v-if="delAsk"><p style="margin-top:0">{{ t('b10.confirm_del', { id: delAsk.id }) }}</p><p class="muted" style="font-size:12px">删除后不可恢复。</p>
        <div class="b8-row" style="justify-content:flex-end;margin-top:12px"><n-button @click="delAsk = null">{{ t('b10.cancel') }}</n-button><n-button type="error" data-b10="del-ok" @click="() => { const r = delAsk; delAsk = null; del(r) }">{{ t('b10.del') }}</n-button></div></template>
    </n-modal>
    <n-modal :show="!!aj" preset="card" style="width:min(480px,96vw)" :title="aj ? t('b10.adjust.title', { id: aj.user_id }) : ''" @update:show="(v: boolean) => !v && (aj = null)">
      <div v-if="aj" class="b8-grid" data-b10="adjust-form">
        <label>{{ t('b10.adjust.type') }}<n-select v-model:value="aj.wallet_type" size="small" :options="Object.keys(meta.adjust_max).map(k => ({ label: k, value: k }))" /></label>
        <label>{{ t('b10.adjust.delta') }}<n-input v-model:value="aj.delta" size="small" data-b10="adjust-delta" /></label>
        <label style="grid-column:1/-1">{{ t('b10.adjust.reason') }}<n-input v-model:value="aj.reason" size="small" maxlength="200" data-b10="adjust-reason" /></label>
        <p class="muted" style="grid-column:1/-1;font-size:12px;margin:0">{{ t('b10.adjust.max', { m: meta.adjust_max[aj.wallet_type] }) }}</p>
      </div>
      <div class="b8-row" style="justify-content:flex-end;margin-top:12px"><n-button @click="aj = null">{{ t('b10.cancel') }}</n-button><n-button type="primary" :loading="busy === 'adjust'" data-b10="adjust-ok" @click="adjust">{{ t('b10.adjust') }}</n-button></div>
    </n-modal>
  </div>
</template>
