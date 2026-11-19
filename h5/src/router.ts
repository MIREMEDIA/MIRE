import { createRouter, createWebHashHistory } from 'vue-router'
// Hash history: works as plain static files on BaoTa/nginx without try_files rewrites.
export const router = createRouter({ history: createWebHashHistory(), routes: [
  { path: '/', component: () => import('./views/Home.vue'), meta: { tab: 'home' } },
  { path: '/discover', component: () => import('./views/Discover.vue'), meta: { tab: 'home' } },
  { path: '/shorts', component: () => import('./views/Player.vue'), meta: { tab: 'shorts', dark: true } },
  { path: '/play/:id', component: () => import('./views/Player.vue'), meta: { dark: true } },
  { path: '/mylist', component: () => import('./views/MyList.vue'), meta: { tab: 'mylist' } },
  { path: '/me', component: () => import('./views/Profile.vue'), meta: { tab: 'me' } },
  { path: '/search', component: () => import('./views/Search.vue') },
  { path: '/wallet', component: () => import('./views/Wallet.vue') },
  { path: '/vip', component: () => import('./views/Vip.vue') },
  { path: '/rewards', component: () => import('./views/Rewards.vue'), meta: { tab: 'rewards' } },
  { path: '/language', component: () => import('./views/Language.vue') },
  { path: '/login', component: () => import('./views/Login.vue') },
  { path: '/orders', component: () => import('./views/Orders.vue') },
  { path: '/invite', component: () => import('./views/Invite.vue') },
  { path: '/settings', component: () => import('./views/Settings.vue') },
  { path: '/forgot', component: () => import('./views/ForgotPwd.vue') },
  { path: '/walletlog', component: () => import('./views/WalletLog.vue') },
  { path: '/withdraw', component: () => import('./views/Withdraw.vue') },
  { path: '/doc/:id', component: () => import('./views/Doc.vue') },
  // FE-M3: interactive games + Studio bridge
  { path: '/games', component: () => import('./views/Games.vue'), meta: { tab: 'home' } },
  { path: '/game/:id', component: () => import('./views/GameDetail.vue') },
  { path: '/studio', component: () => import('./views/StudioBridge.vue') },
  // legacy uni-app paths
  { path: '/pages/video/play', redirect: to => `/play/${to.query.id}` },
  { path: '/:p(.*)*', redirect: '/' } ] })
