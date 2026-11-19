import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import Login from './views/Login.vue'
import Layout from './views/Layout.vue'
import { getToken } from './api'
import './global.css'
import { track } from './loading'
import { redirects } from './menu'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/login', component: Login },
    { path: '/', component: Layout, children: [
      { path: '', redirect: '/p/dash' },
      ...Object.entries(redirects).map(([id, to]) => ({ path: 'p/' + id, redirect: to })),   // FE-M5
      { path: 'p/dash', component: () => track(import('./views/Dashboard.vue'), 'route') },
      { path: 'p/:id', component: () => track(import('./views/PageHost.vue'), 'route'), props: true },
    ] },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
router.beforeEach(to => (to.path !== '/login' && !getToken() ? '/login' : true))
createApp(App).use(router).mount('#app')
