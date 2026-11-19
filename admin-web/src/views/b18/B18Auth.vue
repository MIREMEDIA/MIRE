<script setup lang="ts">
// B18 权限管理：角色组 / 菜单规则 / 管理员（FastAdmin vs_auth_group / vs_auth_rule / vs_admin / vs_auth_group_access）。
// 服务端 b18.* + adm_enforce(adm.auth) + adm_page_enforce 是闸门；这里按 adm.me 隐藏/禁用按钮，403 显示同一提示。
// 手机（<768px）：MTable 渲染为卡片，弹窗宽 96vw，规则树可滚动。
import { computed, h, ref, watch } from 'vue'
import { NAlert, NButton, NCheckbox, NInput, NModal, NPopconfirm, NSelect, NTag, NTree, useMessage } from 'naive-ui'
import { api } from '../../api'
import { fmtTime } from '../../b8i18n'
import { loadAdm } from '../../adm'
import MTable from '../../components/MTable.vue'
import B8Bar from '../b8/B8Bar.vue'
import RoTip from '../../components/RoTip.vue'
import { RO_DB, RO_PERM } from '../../ro'
import '../b8/b8.css'
const props = defineProps<{ page: any; mode: string }>()
const msg = useMessage()
const meta = ref<any>(null); const rows = ref<any[]>([]); const total = ref(0); const err = ref(''); const forb = ref(''); const busy = ref(''); const loading = ref(true)   // FE-M5：首屏 meta 阶段即显示加载，不闪「无数据」
const f = ref({ kw: '', status: '', page: 1 })
const groups = ref<any[]>([]); const rules = ref<any[]>([])
// FE-M5（B21.3 #3）：b18.meta.writable = 环境可写 且 本人有 adm.auth（后端按角色算），按钮只认它；不可写时给出原因
const canW = computed(() => meta.value?.writable === true)
// FE-M6：库不可写只在后端明确 env_writable=false 时提示；其余（perm_write=false / 字段缺失）一律按无权限
const roReason = computed(() => !meta.value || meta.value.writable !== false ? '' : meta.value.env_writable === false ? RO_DB : RO_PERM)
const RT = (vn: any) => h(RoTip, { reason: roReason.value }, () => vn)
const isSuper = computed(() => !!meta.value?.super)
function fail(e: any) { if (e?.code === 403) { forb.value = e.message; msg.error('无权限：' + e.message) } else msg.error(e.message) }
let seq = 0
async function load() {
  const my = ++seq; err.value = ''; loading.value = true
  try {
    const [, mt] = await Promise.all([loadAdm(), meta.value ? meta.value : api('b18.meta')]); meta.value = mt
    if (props.mode === 'admins') {
      const [x, g] = await Promise.all([api('b18.admins.list', { kw: f.value.kw, status: f.value.status, page: f.value.page, size: 20 }), api('b18.groups.list').catch(() => ({ rows: [] }))])
      if (my !== seq) return; rows.value = x.rows; total.value = x.total; groups.value = g.rows
    } else if (props.mode === 'groups') {
      const [x, r] = await Promise.all([api('b18.groups.list'), api('b18.rules.list')])
      if (my !== seq) return; groups.value = x.rows; rules.value = r.rows
      const kw = f.value.kw.trim(); rows.value = x.rows.filter((g: any) => (!kw || g.name.includes(kw) || String(g.id) === kw) && (!f.value.status || g.status === f.value.status)); total.value = rows.value.length
    } else {
      const x = await api('b18.rules.list', { kw: f.value.kw })
      if (my !== seq) return; rules.value = x.rows; rows.value = x.rows.filter((r: any) => !f.value.status || r.status === f.value.status); total.value = rows.value.length
    }
  } catch (e: any) { if (my !== seq) return; err.value = e.message; if (e.code === 403) forb.value = e.message }
  finally { if (my === seq) loading.value = false }
}
watch(() => props.mode, () => { f.value = { kw: '', status: '', page: 1 }; load() }, { immediate: true })
watch(() => f.value.page, (n, o) => { if (n !== o && props.mode === 'admins') load() })
const search = () => { if (props.mode === 'admins' && f.value.page !== 1) f.value.page = 1; else load() }
const statusOpts = [{ label: '全部状态', value: '' }, { label: '正常 normal', value: 'normal' }, { label: '禁用 hidden', value: 'hidden' }]
const stTag = (s: string) => h(NTag, { size: 'small', type: s === 'normal' ? 'success' : 'default', bordered: false }, () => s === 'normal' ? '正常' : '禁用')
const gName = (id: number) => groups.value.find((g: any) => g.id === id)?.name || (id ? '#' + id : '—')

// ---- 规则树（角色组授权用）：非超管只能勾自己拥有的规则 ----
const myRules = computed<number[] | null>(() => meta.value?.my_rules ?? null)
const tree = computed(() => {
  const by: Record<number, any> = {}; const out: any[] = []
  for (const r of rules.value) by[r.id] = { key: r.id, label: `${r.title || r.name}  ·  ${r.name}`, children: [] as any[], disabled: myRules.value !== null && !myRules.value.includes(r.id) }
  for (const r of rules.value) (by[r.pid] ? by[r.pid].children : out).push(by[r.id])
  const strip = (n: any) => { if (!n.children.length) delete n.children; else n.children.forEach(strip) }; out.forEach(strip)
  return out
})
const descendants = (id: number): number[] => rules.value.filter((r: any) => r.pid === id).flatMap((r: any) => [r.id, ...descendants(r.id)])

// ---- 编辑 ----
const ed = ref<any>(null)
function openGroup(g?: any) { ed.value = g ? { id: g.id, pid: g.pid, name: g.name, status: g.status, rules: Array.isArray(g.rule_ids) ? [...g.rule_ids] : [] } : { id: 0, pid: 0, name: '', status: 'normal', rules: [] } }
function openRule(r?: any) { ed.value = r ? { ...r, ismenu: !!r.ismenu } : { id: 0, pid: rules.value.find((x: any) => x.name === 'mire')?.id || 0, name: '', title: '', icon: '', remark: '', ismenu: false, weigh: 0, status: 'normal' } }
function openAdmin(a?: any) { ed.value = a ? { id: a.id, username: a.username, nickname: a.nickname || '', email: a.email || '', mobile: a.mobile || '', status: a.status || 'normal', password: '', groups: (a.groups || []).map((g: any) => g.id) } : { id: 0, username: '', nickname: '', email: '', mobile: '', status: 'normal', password: '', groups: [] } }
const open = (r?: any) => props.mode === 'groups' ? openGroup(r) : props.mode === 'rules' ? openRule(r) : openAdmin(r)
function onCheck(keys: number[], _o: any, meta2: any) {
  // 勾父级时连带勾选全部下级（取消同理），但不会勾到禁用（自己没有）的规则
  const node = meta2?.node; let k = new Set(keys)
  if (node && meta2.action) { const ds = descendants(node.key).filter(id => myRules.value === null || myRules.value.includes(id)); if (meta2.action === 'check') ds.forEach(d => k.add(d)); else ds.forEach(d => k.delete(d)) }
  ed.value.rules = [...k]
}
async function save() {
  busy.value = 'save'
  try {
    const x: any = await api('b18.' + props.mode + '.save', {}, props.mode === 'rules' ? { ...ed.value, ismenu: ed.value.ismenu ? 1 : 0 } : ed.value)
    msg.success('已保存 #' + x.id); ed.value = null
    if (props.mode !== 'rules') await loadAdm(true)   // 自己的权限可能变化：立即刷新菜单
    await load()
  } catch (e: any) { fail(e) } finally { busy.value = '' }
}
async function del(r: any) { busy.value = 'del' + r.id; try { await api('b18.' + props.mode + '.delete', {}, { id: r.id }); msg.success('已删除 #' + r.id); await load() } catch (e: any) { fail(e) } finally { busy.value = '' } }

const opCol = (r: any, editable = true, deletable = true) => h('div', { class: 'b8-row' }, [
  RT(h(NButton, { size: 'small', disabled: !canW.value || !editable, 'data-b18': 'edit', onClick: () => open(r) }, () => '编辑')),
  RT(h(NPopconfirm, { onPositiveClick: () => del(r) }, { trigger: () => h(NButton, { size: 'small', type: 'error', disabled: !canW.value || !deletable, loading: busy.value === 'del' + r.id, 'data-b18': 'del' }, () => '删除'), default: () => `确认删除 #${r.id}？` }))])
const cols = computed(() => {
  if (props.mode === 'groups') return [{ title: 'ID', key: 'id', width: 60 }, { title: '父级', key: 'pid', render: (r: any) => gName(r.pid) }, { title: '名称', key: 'name', render: (r: any) => r.super ? h('span', [r.name, ' ', h(NTag, { size: 'small', type: 'warning', bordered: false }, () => '超管 *')]) : r.name },
    { title: '权限数', key: 'rule_count' }, { title: '成员', key: 'members' }, { title: '状态', key: 'status', render: (r: any) => stTag(r.status) }, { title: '操作', key: 'op', render: (r: any) => opCol(r, !r.super, !r.super) }]
  if (props.mode === 'rules') return [{ title: 'ID', key: 'id', width: 60 }, { title: '标题', key: 'title' }, { title: '规则', key: 'name' }, { title: '父级', key: 'pid', render: (r: any) => r.pid ? '#' + r.pid : '—' },
    { title: '菜单', key: 'ismenu', render: (r: any) => r.ismenu ? '是' : '否' }, { title: '排序', key: 'weigh' }, { title: '状态', key: 'status', render: (r: any) => stTag(r.status) }, { title: '操作', key: 'op', render: (r: any) => opCol(r, isSuper.value, isSuper.value && r.name !== 'mire') }]
  const c: any[] = [{ title: 'ID', key: 'id', width: 60 }, { title: '用户名', key: 'username' }]
  for (const k of ['nickname', 'email', 'mobile']) if (meta.value?.admin_cols?.includes(k)) c.push({ title: { nickname: '昵称', email: '邮箱', mobile: '手机' }[k], key: k })
  c.push({ title: '角色组', key: 'groups', render: (r: any) => h('div', { class: 'b8-row' }, (r.groups || []).length ? r.groups.map((g: any) => h(NTag, { size: 'small', type: g.super ? 'warning' : 'info', bordered: false }, () => g.name)) : [h('span', { class: 'muted' }, '未分配')]) })
  if (meta.value?.admin_cols?.includes('logintime')) c.push({ title: '最后登录', key: 'logintime', render: (r: any) => +r.logintime ? fmtTime(r.logintime) : '—' })
  c.push({ title: '状态', key: 'status', render: (r: any) => stTag(r.status) }, { title: '操作', key: 'op', render: (r: any) => opCol(r, isSuper.value || !r.super, r.id !== meta.value?.me?.uid && (isSuper.value || !r.super)) })
  return c
})
const groupOpts = computed(() => groups.value.map((g: any) => ({ label: g.name + (g.super ? '（超管 *）' : '') + (g.status !== 'normal' ? '（禁用）' : ''), value: g.id, disabled: g.super && !isSuper.value })))
const parentOpts = computed(() => [{ label: '无（顶级）', value: 0 }, ...groups.value.filter((g: any) => !ed.value || g.id !== ed.value.id).map((g: any) => ({ label: g.name, value: g.id }))])
const ruleParentOpts = computed(() => [{ label: '无（顶级）', value: 0 }, ...rules.value.filter((r: any) => !ed.value || r.id !== ed.value.id).map((r: any) => ({ label: `${r.title} · ${r.name}`, value: r.id }))])
const hint = computed(() => ({ groups: '勾选「页面」= 菜单可见 + 该页数据接口；勾选「操作节点」= 对应的新增/编辑/删除。保存后立即生效，无权限的菜单隐藏、接口返回 403。',
  rules: 'mire/page/* 控制新后台页面，mire/node/adm.* 控制写操作；ismenu=0，不影响 FastAdmin 旧后台菜单。仅超级管理员可修改。',
  admins: '密码按 FastAdmin 规则 md5(md5(密码)+salt) 保存；不能删除/停用自己，保留至少一个超级管理员。' } as any)[props.mode])
</script>
<template>
  <div class="b8" :data-b18="mode">
    <B8Bar :title="page.t" :writable="meta?.writable" :reason="roReason" :hint="hint" />
    <n-alert v-if="meta && !meta.auth_on" type="warning" :bordered="false" data-b18="auth-off" style="margin:8px 0">尚未运行 B18 迁移（vs_auth_rule 没有 mire 规则）：新后台仍按旧「创作中心角色」判权；分配的角色组在迁移后生效。</n-alert>
    <n-alert v-if="forb" type="error" :bordered="false" data-b18="forbidden" style="margin:8px 0">无权限：{{ forb }}</n-alert>
    <n-alert v-else-if="err" type="error" :bordered="false" style="margin:8px 0">{{ err }}</n-alert>
    <div class="b8-row" style="margin:8px 0">
      <n-input v-model:value="f.kw" :placeholder="mode === 'admins' ? 'ID / 用户名 / 昵称' : mode === 'groups' ? '组名 / ID' : '规则 / 标题'" clearable style="max-width:260px" data-b18="kw" @keyup.enter="search" />
      <n-select v-model:value="f.status" :options="statusOpts" size="medium" style="width:140px" data-b18="status" @update:value="search" />
      <n-button type="primary" :loading="loading" data-b18="search" @click="search">查询</n-button>
      <RoTip :reason="roReason"><n-button :disabled="!canW || (mode === 'rules' && !isSuper)" data-b18="add" @click="open()">新增</n-button></RoTip>
    </div>
    <p class="muted" style="margin:6px 0" data-b18="total">共 {{ loading ? '—' : total }} 条</p>
    <MTable :loading="loading" :columns="cols" :data="rows" :remote="mode === 'admins'" size="small" :scroll-x="900" :row-key="(r: any) => r.id"
      :pagination="mode === 'admins' ? { page: f.page, pageSize: 20, itemCount: total, onUpdatePage: (p: number) => (f.page = p) } : { pageSize: 50 }" />
    <n-modal :show="!!ed" preset="card" style="width:min(640px,96vw)" :title="(ed?.id ? '编辑 #' + ed.id : '新增') + ' · ' + page.t" @update:show="(v: boolean) => !v && (ed = null)">
      <div v-if="ed && mode === 'groups'" class="b8-grid" data-b18="form">
        <label>父级<n-select v-model:value="ed.pid" size="small" :options="parentOpts" data-b18="f-pid" /></label>
        <label>名称<span style="color:#d03050">*</span><n-input v-model:value="ed.name" size="small" maxlength="100" data-b18="f-name" /></label>
        <label>状态<n-select v-model:value="ed.status" size="small" :options="statusOpts.slice(1)" data-b18="f-status" /></label>
        <div style="grid-column:1/-1"><b>权限（已选 {{ ed.rules.length }}）</b>
          <div style="max-height:46vh;overflow:auto;border:1px solid #eee;border-radius:6px;padding:6px;margin-top:4px" data-b18="tree">
            <n-tree :data="tree" checkable block-line :cascade="false" :checked-keys="ed.rules" :default-expand-all="false" :default-expanded-keys="rules.filter((r: any) => r.name === 'mire' || /^mire\/(g|node)$/.test(r.name)).map((r: any) => r.id)" @update:checked-keys="onCheck" />
          </div></div>
      </div>
      <div v-else-if="ed && mode === 'rules'" class="b8-grid" data-b18="form">
        <label>父级<n-select v-model:value="ed.pid" size="small" filterable :options="ruleParentOpts" /></label>
        <label>规则<span style="color:#d03050">*</span><n-input v-model:value="ed.name" size="small" maxlength="100" data-b18="f-name" /></label>
        <label>标题<span style="color:#d03050">*</span><n-input v-model:value="ed.title" size="small" maxlength="50" data-b18="f-title" /></label>
        <label>图标<n-input v-model:value="ed.icon" size="small" maxlength="50" /></label>
        <label>排序<n-input v-model:value="ed.weigh" size="small" /></label>
        <label>状态<n-select v-model:value="ed.status" size="small" :options="statusOpts.slice(1)" /></label>
        <label style="grid-column:1/-1">备注<n-input v-model:value="ed.remark" size="small" maxlength="255" /></label>
        <n-checkbox v-model:checked="ed.ismenu">FastAdmin 菜单（ismenu）</n-checkbox>
      </div>
      <div v-else-if="ed" class="b8-grid" data-b18="form">
        <label>用户名<span style="color:#d03050">*</span><n-input v-model:value="ed.username" size="small" maxlength="20" data-b18="f-username" /></label>
        <label v-if="meta?.admin_cols?.includes('nickname')">昵称<span style="color:#d03050">*</span><n-input v-model:value="ed.nickname" size="small" maxlength="50" data-b18="f-nickname" /></label>
        <label v-if="meta?.admin_cols?.includes('email')">邮箱<n-input v-model:value="ed.email" size="small" maxlength="100" data-b18="f-email" /></label>
        <label v-if="meta?.admin_cols?.includes('mobile')">手机<n-input v-model:value="ed.mobile" size="small" maxlength="11" /></label>
        <label>密码<span v-if="!ed.id" style="color:#d03050">*</span><n-input v-model:value="ed.password" size="small" type="password" show-password-on="click" :placeholder="ed.id ? '留空则不修改' : '6–30 位'" autocomplete="new-password" data-b18="f-password" /></label>
        <label>状态<n-select v-model:value="ed.status" size="small" :options="statusOpts.slice(1)" data-b18="f-status" /></label>
        <label style="grid-column:1/-1">角色组<n-select v-model:value="ed.groups" multiple size="small" :options="groupOpts" data-b18="f-groups" /></label>
      </div>
      <div class="b8-row" style="justify-content:flex-end;margin-top:12px"><n-button @click="ed = null">取消</n-button><RoTip :reason="roReason"><n-button type="primary" :disabled="!canW" :loading="busy === 'save'" data-b18="save" @click="save">保存</n-button></RoTip></div>
    </n-modal>
  </div>
</template>
