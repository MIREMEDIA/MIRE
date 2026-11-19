// FE-M8：操作日志类型中文映射。后端 adm_log.php::adm_log_type() 按 url 的 r= 前缀推导 type，
// 不认识的 r=（如 cu/qa_magic 写入的 r=qa_magic_login）一律返回 'other'；前端再按 url 细分并补中文。
// 来源（只读核对）：adm_log_types()（login/b1/b3/b4/b8/b9/b10/b18/profile/cc/fa）+ adm_log_type() 的 'other'
//   + 写日志的路由：index.php 'login'、bN.php 'bN.*'、adm_profile.php 'adm.profile.*'、cc/routes.php 'cc.perm.save'、qa_magic_lib.php 'qa_magic_login'
export const LOG_TYPE_ZH: Record<string, string> = {
  login: '登录', b1: '系统配置（B1）', b3: '会员/调账（B3）', b4: '评论/任务（B4）', b8: '支付/任务/提现（B8）', b9: '打赏/币种（B9）',
  b10: '短剧/订单/套餐（B10）', b18: '权限管理（B18）', profile: '个人资料', cc: '创作中心权限', fa: 'FA 旧后台',
  qa_magic_login: 'QA一次性登录', other: '其他',
}
// 后端归为 other 的路由 → 前端细分类型（仅显示用，不作为筛选项，后端 type 筛选不认）
export const ROUTE_TYPE: Record<string, string> = { qa_magic_login: 'qa_magic_login' }
// 后端不支持按这些 key 筛选（adm_log_type_sql 会 400），不放进筛选下拉
export const NO_FILTER = new Set(['other', 'qa_magic_login'])
export function routeOf(url: any): string { const m = /[?&]r=([\w.]+)/.exec(String(url ?? '')); return m ? m[1] : '' }
export function logTypeOf(row: any): string {
  const t = String(row?.type ?? '')
  if (t && t !== 'other' && LOG_TYPE_ZH[t]) return t
  const r = routeOf(row?.url)
  if (ROUTE_TYPE[r]) return ROUTE_TYPE[r]
  return t || 'other'
}
// meta 标签优先（后端口径），再用本地中文；都没有时不再显示英文 key，未知类型显示「其他（key）」
export function logTypeLabel(key: string, meta: { value: string; label: string }[] = []): string {
  if (!key) return '—'
  const m = meta.find(x => x.value === key)?.label
  if (m && m !== key) return m
  return LOG_TYPE_ZH[key] || `其他（${key}）`
}
// 标题：后端对 qa_magic_login 写的 title 也是英文 key
export function logTitle(row: any): string { const s = String(row?.title ?? ''); return LOG_TYPE_ZH[s] && ROUTE_TYPE[s] ? LOG_TYPE_ZH[s] : s }
// 筛选下拉：meta 返回的 + 本地已知可筛选类型（补齐缺中文的）
export function filterTypes(meta: { value: string; label: string }[] | null): { value: string; label: string }[] {
  const base = (meta && meta.length ? meta : []).map(x => ({ value: x.value, label: logTypeLabel(x.value, meta || []) }))
  for (const k of Object.keys(LOG_TYPE_ZH)) if (!NO_FILTER.has(k) && !base.some(x => x.value === k)) base.push({ value: k, label: LOG_TYPE_ZH[k] })
  return base.filter(x => !NO_FILTER.has(x.value))
}
