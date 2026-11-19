import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { i18n } from './i18n'
import './style.css'
import { st } from './i18n/fem1'
import { watch } from 'vue'
import { toast } from './components/toast'
import { safeRedirect } from './api/b7Core'
const app = createApp(App).use(createPinia()).use(router).use(i18n)
app.config.globalProperties.$st = st // FE-M1: backend display strings -> UI language
// keep compatibility with live share links (?token=, ?channel=)
const q = new URLSearchParams(location.search)
import('./stores/user').then(({ useUser }) => { const u = useUser(); const t = q.get('token'); if (t && t.length === 36) u.setToken(t); if (q.get('channel')) u.channel = q.get('channel')!
  // B7 #4/#5: keep the sharer's spm / link_sign until registration (captchaLogin / thirdAuthorize)
  const hq = new URLSearchParams(location.hash.split('?')[1] || ''); const spm = q.get('spm') || hq.get('spm'); const ls = q.get('link_sign') || hq.get('link_sign')
  if (spm) localStorage.setItem('mire_spm', spm); if (ls) localStorage.setItem('mire_link_sign', ls)
  if (u.token) u.syncServer()
  // FE-M1 QA-R1-2：任何接口返回 401（http 或 code）时，若本地还留着 token，说明登录已失效：清掉 token、提示，并在账户类页面引导去登录。
  // 只认 401；金币订单接口的 402（余额不足）不走这里。
  watch(() => u.needLogin, (v) => {
    if (!v) return
    u.needLogin = false
    if (!u.token) return
    u.logout()
    toast((i18n.global as any).t('fem1.loginAgain'), 3000)
    const r = router.currentRoute.value
    if (r.path !== '/login' && ACCOUNT_PAGES.includes(r.path)) router.push({ path: '/login', query: { redirect: r.fullPath } })
  })
})
const ACCOUNT_PAGES = ['/me', '/wallet', '/orders', '/settings', '/walletlog', '/withdraw', '/invite']
// FE-M1 QA-R1-3：已登录时访问 #/login 直接回首页（或 ?redirect=）
router.beforeEach(async (to) => {
  if (to.path !== '/login') return true
  const { useUser } = await import('./stores/user'); const u = useUser()
  return u.token ? safeRedirect(to.query.redirect, '/') : true
})
app.mount('#app')

// FE-M1 H-S3：封面图加载失败（如 https 页面里的 http 图片被拦截）时显示占位底色，不再露出裂图图标
window.addEventListener('error', (e) => {
  const el = e.target as HTMLImageElement | null
  if (el && el.tagName === 'IMG' && !el.dataset.fem1Broken) {
    el.dataset.fem1Broken = '1'
    el.src = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="3" height="4"><rect width="3" height="4" fill="#2a2a2e"/></svg>')
  }
}, true)
