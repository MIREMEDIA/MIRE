<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NLayout, NLayoutSider, NLayoutHeader, NLayoutContent, NMenu, NTag, NDropdown, NButton, NDrawer, NDrawerContent, type MenuOption, type DropdownOption } from 'naive-ui'
import { isMobile } from '../mobile'
import { pages, live, groupIcon, findPage, b1, hidden, notOnH5, NOT_ON_H5, redirects, menuHidden } from '../menu'
import { logout } from '../api'
import { cc, loadPerms, can } from '../cc'
import { adm, loadAdm } from '../adm'
const route = useRoute(), router = useRouter()
const collapsed = ref(false)
const logo = './logo-dark.png', fav = './favicon.png'
const user = ref(JSON.parse(localStorage.getItem('mire_user') || '{}'))
// FE-M5：个人资料页改昵称后刷新右上角名字
window.addEventListener('mire-user', () => { user.value = JSON.parse(localStorage.getItem('mire_user') || '{}') })

function label(p: any) {
  const badge = live[p.id] || b1[p.id] || p.id === 'dash' ? h('span', { class: 'dot live' }) : p.st === '新增' ? h('span', { class: 'new' }, 'NEW') : null
  const tag = notOnH5.has(p.id) ? h('span', { class: 'na', title: NOT_ON_H5 }, NOT_ON_H5) : null
  return () => h('span', { class: 'mi' }, [p.t, badge, tag])
}
const options = computed<MenuOption[]>(() => {
  const groups: Record<string, any> = {}
  const out: MenuOption[] = []
  for (const p of pages) {
    if (hidden.has(p.id)) continue   // B1 #33 小说：新 H5 不做，隐藏菜单
    if (redirects[p.id] || menuHidden.has(p.id)) continue   // FE-M5：去掉 7 个占位页；an_* / profile 只隐藏菜单
    if (p.perm && !can(p.perm)) continue   // 创作中心：按角色权限过滤菜单
    if (adm.loaded && adm.pages !== null && !adm.pages.includes(p.id)) continue   // B18：FastAdmin 角色组未授予的页面不显示
    if (!groups[p.g]) { groups[p.g] = { label: p.g, key: 'g:' + p.g, icon: () => h('span', { class: 'gi' }, groupIcon[p.g] || '•'), children: [], _subs: {} }; out.push(groups[p.g]) }
    const g = groups[p.g]
    const item = { label: label(p), key: p.id }
    if (p.s) {
      if (!g._subs[p.s]) { g._subs[p.s] = { label: p.s, key: 's:' + p.g + p.s, children: [] }; g.children.push(g._subs[p.s]) }
      g._subs[p.s].children.push(item)
    } else g.children.push(item)
  }
  out.forEach((g: any) => delete g._subs)
  return out
})
const active = computed(() => (route.params.id as string) || 'dash')
const cur = computed(() => findPage(active.value))
const expanded = ref<string[]>([])
function syncExpand() { const p = cur.value; if (p) expanded.value = Array.from(new Set([...expanded.value, 'g:' + p.g, ...(p.s ? ['s:' + p.g + p.s] : [])])) }
syncExpand()
router.afterEach(syncExpand)
onMounted(() => { loadPerms(); loadAdm() })
// FE-M6：加载完成前显示「—」，只用 cc.me 返回值，不给默认角色
const ccRole = computed(() => !cc.loaded || cc.err ? '—' : cc.role === 'none' ? '无权限' : (cc.role_name || cc.role || '—'))
// FE-M5：头像菜单 = 个人资料 + 退出登录
const userMenu: DropdownOption[] = [{ label: '个人资料', key: 'profile', props: { 'data-m5': 'menu-profile' } as any }, { type: 'divider', key: 'd1' }, { label: '退出登录', key: 'out', props: { 'data-m5': 'menu-out' } as any }]
function onUser(k: string) { if (k === 'profile') { nav.value = false; router.push('/p/profile') } else if (k === 'out') logout() }
const uname = computed(() => user.value.nickname || user.value.username || '管理员')
const nav = ref(false)   // phone: menu lives in a left drawer
function go(k: string) { nav.value = false; router.push('/p/' + k) }
</script>
<template>
  <div v-if="isMobile" class="m-shell" data-b19="m-shell">
    <n-layout-header bordered class="hdr m-hdr">
      <button class="m-burger" aria-label="打开菜单" data-nav-toggle @click="nav = true"><span /><span /><span /></button>
      <div class="m-title"><b>{{ cur?.t }}</b><span class="muted">{{ cur?.g }}</span></div>
      <n-dropdown :options="userMenu" trigger="click" @select="onUser"><n-button quaternary class="m-user" data-m5="avatar"><span class="av">{{ uname.slice(0, 1) }}</span>{{ uname.slice(0, 6) }} ▾</n-button></n-dropdown>
    </n-layout-header>
    <div class="m-badges" data-b19="m-badges"><n-tag size="small" round :bordered="false" style="background:#1a1a1a;color:#fff" data-m6="cc-role">{{ ccRole }}</n-tag><n-tag type="warning" size="small" round>STAGING · 测试库</n-tag></div>
    <div class="m-content" data-b19="m-content">
      <router-view :key="route.fullPath" />
    </div>
    <n-drawer v-model:show="nav" placement="left" :width="'84vw'" class="m-nav" :auto-focus="false">
      <n-drawer-content :native-scrollbar="false" body-content-style="padding:0" class="m-nav-body">
        <div class="logo"><img :src="logo" /></div>
        <n-menu inverted :options="options" :value="active" v-model:expanded-keys="expanded" :indent="16" :root-indent="18" @update:value="go" />
      </n-drawer-content>
    </n-drawer>
  </div>
  <n-layout v-else has-sider style="height:100vh">
    <n-layout-sider bordered collapse-mode="width" :collapsed-width="64" :width="232" :collapsed="collapsed" show-trigger @collapse="collapsed = true" @expand="collapsed = false" :native-scrollbar="false" inverted class="sider">
      <div class="logo"><img :src="collapsed ? fav : logo" :class="{ small: collapsed }" /></div>
      <n-menu inverted :options="options" :value="active" v-model:expanded-keys="expanded" :collapsed="collapsed" :collapsed-width="64" :indent="16" :root-indent="18" @update:value="(k: string) => router.push('/p/' + k)" />
    </n-layout-sider>
    <n-layout>
      <n-layout-header bordered class="hdr">
        <div class="crumb"><span class="muted">{{ cur?.g }}<template v-if="cur?.s"> / {{ cur?.s }}</template> /</span> <b>{{ cur?.t }}</b></div>
        <div style="display:flex;align-items:center;gap:12px">
          <n-tag size="small" round :bordered="false" style="background:#1a1a1a;color:#fff" data-m6="cc-role">创作中心角色：{{ ccRole }}</n-tag>
          <n-tag type="warning" size="small" round>STAGING · 测试库</n-tag>
          <n-dropdown :options="userMenu" trigger="click" @select="onUser"><n-button quaternary size="small" data-m5="avatar"><span class="av">{{ uname.slice(0, 1) }}</span>{{ uname }} ▾</n-button></n-dropdown>
        </div>
      </n-layout-header>
      <n-layout-content content-style="padding:20px 24px;" :native-scrollbar="false" style="height:calc(100vh - 56px);background:#F4F6FB">
        <router-view :key="route.fullPath" />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>
<style scoped>
.sider{background:#101010}
.sider :deep(.n-layout-sider-scroll-container){background:#101010}
.sider :deep(.n-menu){background:#101010}
.logo{height:64px;display:flex;align-items:center;justify-content:center;border-bottom:1px solid #1F1F1F}
.logo img{height:30px}.logo img.small{height:30px;width:30px}
.hdr{height:56px;display:flex;align-items:center;justify-content:space-between;padding:0 24px;background:#fff}
:deep(.gi){font-size:14px;width:18px;text-align:center}
:deep(.mi){display:inline-flex;align-items:center;gap:6px}
:deep(.dot.live){width:6px;height:6px;border-radius:50%;background:#2ECC71;display:inline-block}
:deep(.new){font-size:9px;background:#FF2C48;color:#fff;border-radius:3px;padding:0 4px;line-height:14px}
:deep(.na){font-size:9px;background:#3A3A3A;color:#BBB;border-radius:3px;padding:0 4px;line-height:14px;white-space:nowrap}
.av{display:inline-flex;width:22px;height:22px;border-radius:50%;background:#1a1a1a;color:#fff;font-size:12px;align-items:center;justify-content:center;margin-right:6px}
.m-shell{display:flex;flex-direction:column;height:100vh;height:100dvh;overflow:hidden;background:#F4F6FB}
.m-hdr{height:52px;padding:0 6px 0 2px;gap:4px;flex:0 0 auto;position:relative;z-index:2}
.m-burger{width:44px;height:44px;border:0;background:transparent;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:4px;cursor:pointer;flex:0 0 44px}
.m-burger span{display:block;width:20px;height:2px;background:#1F1F1F;border-radius:2px}
.m-title{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.2}
.m-title b{font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.m-badges{display:flex;gap:6px;padding:6px 10px;background:#F4F6FB;flex-wrap:wrap;flex:0 0 auto;position:relative;z-index:1;border-bottom:1px solid #E6E8EF}
.m-content{background:#F4F6FB;flex:1 1 auto;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:10px 10px 24px;box-sizing:border-box;position:relative;z-index:0}
.m-nav-body .logo{background:#101010}
:global(.m-nav .n-drawer-content), :global(.m-nav .n-drawer-body), :global(.m-nav .n-menu){background:#101010}
</style>
