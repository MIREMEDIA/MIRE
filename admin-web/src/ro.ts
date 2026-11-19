// FE-M6（QA R2 只读复测 / B21.4.1）：不可写原因分两种，只按后端字段判断，不猜。
//  - 页面/资源的 writable（按角色+环境，后端已合并）=== false 且 后端明确给出 db_writable/env_writable === false → 库不可写
//  - 其它 writable === false → 当前账号没有编辑权限
// writable 未加载（undefined/null）时不显示原因（按钮仍置灰，等数据）。
import { reactive } from 'vue'
import { api } from './api'
export const RO_PERM = '当前账号没有编辑权限'
export const RO_DB = '当前库不可写（后端返回：非 staging 库或写入开关已关闭），所有写操作会被拒绝'
export function roReason(writable: any, db?: any): string {
  if (writable !== false) return ''
  return db === false ? RO_DB : RO_PERM
}
// 各模块 status 接口里的 db_writable（b1/b4/b8.status，B21.4 起返回）；拿不到 = undefined（不据此判定库不可写）
export const dbw = reactive<Record<string, boolean | undefined>>({})
const ps: Record<string, Promise<void>> = {}
export function loadDbw(mod: 'b1' | 'b4' | 'b8') {
  if (!ps[mod]) ps[mod] = api(mod + '.status').then((d: any) => { dbw[mod] = typeof d?.db_writable === 'boolean' ? d.db_writable : undefined }).catch(() => { delete ps[mod] })
  return ps[mod]
}
