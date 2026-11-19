// Creator Center shared client helpers (perms, labels, formatting)
import { reactive } from 'vue'
import { api, getToken } from './api'
export const cc = reactive<{ loaded: boolean; perms: string[]; role: string; role_name: string; err: string }>({ loaded: false, perms: [], role: '', role_name: '', err: '' })
// FE-M6：按 token 缓存——换号/改密换 token 后必须重新拉 cc.me，否则顶栏会残留上一个账号的角色（QA：只读号先显示「超级管理员」）
let ccTok: string | null = null
export async function loadPerms(force = false) {
  if (cc.loaded && !force && ccTok === getToken()) return cc
  if (ccTok !== getToken()) { cc.loaded = false; cc.role = ''; cc.role_name = ''; cc.perms = [] }
  ccTok = getToken()
  try { const d: any = await api('cc.me'); cc.perms = d.perms; cc.role = d.role; cc.role_name = d.role_name; cc.err = '' }
  catch (e: any) { cc.perms = []; cc.err = e.message }
  cc.loaded = true; return cc
}
export const can = (p?: string) => !p || cc.perms.includes(p)
export const asset = (f?: string) => (f ? './api/index.php?r=cc.asset&f=' + encodeURIComponent(f) : '')
export const fmtTime = (v: any) => { const n = Number(v); if (!n) return '—'; return new Date(n * 1000).toLocaleString('zh-CN', { hour12: false }) }
export const fmtDay = (v: any) => { const n = Number(v); if (!n) return '—'; return new Date(n * 1000).toLocaleDateString('zh-CN') }
export const usd = (v: any) => '$' + Number(v || 0).toFixed(2)
type TagT = 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary'
export const pubStatus: Record<string, [string, TagT]> = {
  pending: ['待审核', 'info'], focus: ['重点审核', 'warning'], auto_rejected: ['AI 自动驳回', 'error'], approved: ['已通过', 'success'],
  rejected: ['已驳回', 'error'], changes_requested: ['要求修改', 'warning'], withdrawn: ['已撤回', 'default'],
}
export const bandLabel: Record<string, [string, TagT]> = { low: ['低风险 <30', 'success'], mid: ['中风险 30–70', 'warning'], high: ['高风险 >70', 'error'] }
export const signLabel: Record<string, [string, TagT]> = { unsigned: ['未签约', 'default'], pending: ['签约中', 'warning'], signed: ['已签约', 'success'], terminated: ['已解约', 'error'] }
export const kycLabel: Record<string, [string, TagT]> = { pending: ['待审核', 'warning'], none: ['未提交', 'default'], submitted: ['待审核', 'warning'], verified: ['已认证', 'success'], rejected: ['未通过', 'error'] }
export const creatorStatus: Record<string, [string, TagT]> = { active: ['正常', 'success'], banned: ['已封禁', 'error'] }
export const levelLabel: Record<string, string> = { invited: '受邀创作者', signed: '签约创作者', featured: '头部创作者' }
export const wdStatus: Record<string, [string, TagT]> = { pending: ['待审核', 'warning'], approved: ['已批准待打款', 'info'], paid: ['已打款', 'success'], rejected: ['已驳回', 'error'] }
export const stStatus: Record<string, [string, TagT]> = { draft: ['草稿', 'warning'], confirmed: ['已确认', 'success'], void: ['作废', 'default'] }
export const actionLabel: Record<string, string> = { ai_prescreen: 'AI 预审', auto_reject: 'AI 自动驳回', approve: '通过', reject: '驳回', request_changes: '要求修改', note: '备注', claim: '认领' }
export function slaText(left: number | null | undefined) {
  if (left === null || left === undefined) return { t: '—', type: 'default' as TagT }
  const neg = left < 0, a = Math.abs(left), h = Math.floor(a / 3600), m = Math.floor((a % 3600) / 60)
  return { t: (neg ? '超时 ' : '剩余 ') + h + 'h ' + m + 'm', type: (neg ? 'error' : left < 12 * 3600 ? 'warning' : 'success') as TagT }
}
export const langName: Record<string, string> = { zh: '简体中文', en: 'English', es: 'Español', pt: 'Português', id: 'Bahasa Indonesia', th: 'ไทย', 'zh-TW': '繁體中文' }
