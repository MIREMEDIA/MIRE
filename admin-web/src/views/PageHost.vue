<script setup lang="ts">
import { computed, defineAsyncComponent as lazy } from 'vue'
import { track } from '../loading'
import PageLoading from '../components/PageLoading.vue'
import { NAlert, NCard, NResult } from 'naive-ui'
import { findPage, live, b18, b1, b4, b8, b9, b10, hidden, notOnH5, NOT_ON_H5, selfPages } from '../menu'
// FE-M4: 子页面 chunk 加载中显示骨架，并计入全局 loading
const lz = (f: () => Promise<any>) => lazy({ loader: () => track(f(), 'route'), loadingComponent: PageLoading, delay: 150 })
const B1Edit = lz(() => import('./B1Edit.vue'))  // FE-M1 A-G4 按需加载
const B8Pay = lz(() => import('./b8/B8Pay.vue'))  // FE-M1 A-G4 按需加载
const B8Tasks = lz(() => import('./b8/B8Tasks.vue'))  // FE-M1 A-G4 按需加载
const B8Share = lz(() => import('./b8/B8Share.vue'))  // FE-M1 A-G4 按需加载
const B8Records = lz(() => import('./b8/B8Records.vue'))  // FE-M1 A-G4 按需加载
const B8Withdraw = lz(() => import('./b8/B8Withdraw.vue'))  // FE-M1 A-G4 按需加载
const B8Ads = lz(() => import('./b8/B8Ads.vue'))  // FE-M1 A-G4 按需加载
const B9Config = lz(() => import('./b9/B9Config.vue'))  // FE-M1 A-G4 按需加载
const B10Crud = lz(() => import('./b10/B10Crud.vue'))  // FE-M1 A-G4 按需加载
const B18Auth = lz(() => import('./b18/B18Auth.vue'))  // FE-M1 A-G4 按需加载
import { adm, admPage, loadAdm } from '../adm'
const B8C: Record<string, any> = { pay: B8Pay, tasks: B8Tasks, signin: B8Tasks, share: B8Share, video_log: B8Records, sms_log: B8Records, withdraw: B8Withdraw, wd_rule: B8Withdraw, ads: B8Ads }
const B4Comments = lz(() => import('./B4Comments.vue'))  // FE-M1 A-G4 按需加载
const B4Coin = lz(() => import('./B4Coin.vue'))  // FE-M1 A-G4 按需加载
const LiveList = lz(() => import('./LiveList.vue'))  // FE-M1 A-G4 按需加载
const Preview = lz(() => import('./Preview.vue'))  // FE-M1 A-G4 按需加载
const IgEditor = lz(() => import('./IgEditor.vue'))  // FE-M1 A-G4 按需加载
const Profile = lz(() => import('./Profile.vue'))   // FE-M5
const AdminLog = lz(() => import('./AdminLog.vue'))   // FE-M5
const CcHost = lz(() => import('./cc/CcHost.vue'))  // FE-M1 A-G4 按需加载
const props = defineProps<{ id: string }>()
const page = computed(() => findPage(props.id))
loadAdm()
</script>
<template>
  <!-- B1 #33 / B4 #15：隐藏菜单的页面直接访问时显示“未接入”，不加载数据 -->
  <n-card v-if="page && hidden.has(page.id)" size="small" class="not-on-h5">
    <n-result status="info" :title="NOT_ON_H5" :description="`「${page.t}」新 H5 不做（暂不上线），后台菜单已隐藏。`" />
  </n-card>
  <!-- B18：无权限页面（直接输地址进入）显示 403，不加载数据；服务端同样 403 -->
  <Profile v-else-if="page && selfPages.has(page.id)" :page="page" />
  <n-card v-else-if="page && adm.loaded && !admPage(page.id)" size="small" data-b18="forbidden">
    <n-result status="403" title="无权限" :description="`当前账号的角色组没有「${page.t}」页面权限，请联系超级管理员在「系统与安全 › 角色组」分配。`" />
  </n-card>
  <template v-else>
  <n-alert v-if="page && notOnH5.has(page.id)" type="warning" :bordered="false" style="margin-bottom:12px" class="not-on-h5">{{ NOT_ON_H5 }}：本模块在新 H5 暂无生效点，后台改动不会在 H5 显示。</n-alert>
 <component :is="B8C[b8[page.id]]" v-if="page && b8[page.id]" :key="page.id" :page="page" :mode="b8[page.id]" />
  <B18Auth v-else-if="page && b18[page.id]" :key="page.id" :page="page" :mode="b18[page.id]" />
  <B10Crud v-else-if="page && b10[page.id]" :key="page.id" :page="page" :res="b10[page.id]" />
  <B9Config v-else-if="page && b9[page.id]" :key="page.id" :page="page" :mode="b9[page.id]" />
  <B1Edit v-else-if="page && b1[page.id]" :page="page" :res="b1[page.id]" />
  <B4Comments v-else-if="page && b4[page.id] === 'comments'" :page="page" />
  <B4Coin v-else-if="page && b4[page.id]" :page="page" :mode="b4[page.id]" />
  <LiveList v-else-if="page && live[page.id]" :page="page" :res="live[page.id]" />
  <AdminLog v-else-if="page && page.id === 'adminlog'" :page="page" />
  <CcHost v-else-if="page && page.k === 'cc'" :page="page" />
  <IgEditor v-else-if="page && page.id === 'ig'" :page="page" />
  <Preview v-else-if="page" :page="page" />
  <div v-else class="muted">页面不存在</div>
  </template>
</template>
