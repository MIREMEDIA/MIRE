// B10 后台权限（adm.me：角色 + perms）。服务端 adm_enforce / adm_page_enforce 是真正的闸门，这里只用于隐藏菜单、提前禁用按钮/显示无权限提示。
// B18：adm.me 还返回 pages（FastAdmin 角色组授予的页面 id；null = 全部）和 mode（fa_auth / cc_role）。
import { reactive } from 'vue'
import { api, getToken } from './api'
export const adm = reactive<{ loaded: boolean; role: string; perms: string[]; pages: string[] | null; mode: string; err: string }>({ loaded: false, role: '', perms: [], pages: null, mode: '', err: '' })
let p: Promise<void> | null = null
let tok = ''
export function loadAdm(force = false) {
  if (p && !force && tok === getToken()) return p
  tok = getToken()
  p = api('adm.me').then((d: any) => { adm.role = d.role; adm.perms = d.perms || []; adm.pages = Array.isArray(d.pages) ? d.pages : null; adm.mode = d.mode || ''; adm.err = '' })
    .catch((e: any) => { adm.role = 'none'; adm.perms = []; adm.pages = []; adm.err = e.message }).finally(() => { adm.loaded = true })
  return p
}
export const admCan = (perm?: string) => !perm || adm.perms.includes(perm)
// 页面是否可见：pages 为 null（超管 / 未启用 FA auth）时全部可见
export const admPage = (id: string) => !adm.loaded || adm.pages === null || adm.pages.includes(id)
