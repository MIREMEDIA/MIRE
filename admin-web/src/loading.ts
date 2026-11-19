// FE-M4: 全局加载状态。api() 请求计数 + 路由/懒加载 chunk 计数，供 App.vue 顶部进度条与「加载中」提示使用。
import { reactive, computed } from 'vue'
export const loadState = reactive({ api: 0, route: 0, slow: false })
export const busy = computed(() => loadState.api + loadState.route > 0)
let slowT: any = null
function sync() {
  if (loadState.api + loadState.route > 0) { if (!slowT && !loadState.slow) slowT = setTimeout(() => { slowT = null; if (loadState.api + loadState.route > 0) loadState.slow = true }, 600) }
  else { clearTimeout(slowT); slowT = null; loadState.slow = false }
}
export function begin(k: 'api' | 'route' = 'api') { loadState[k]++; sync() }
export function end(k: 'api' | 'route' = 'api') { loadState[k] = Math.max(0, loadState[k] - 1); sync() }
export async function track<T>(p: Promise<T>, k: 'api' | 'route' = 'api'): Promise<T> { begin(k); try { return await p } finally { end(k) } }
