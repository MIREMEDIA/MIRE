<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { NResult, NSpin } from 'naive-ui'
import type { PageSpec } from '../../menu'
import { cc, loadPerms, can } from '../../cc'
import CcKyc from './CcKyc.vue'
import CcReview from './CcReview.vue'
import CcReviewDetail from './CcReviewDetail.vue'
import CcCreators from './CcCreators.vue'
import CcInvites from './CcInvites.vue'
import CcRevenue from './CcRevenue.vue'
import CcWithdraw from './CcWithdraw.vue'
import CcSpark from './CcSpark.vue'
import CcCost from './CcCost.vue'
import CcComp from './CcComp.vue'
import CcConfig from './CcConfig.vue'
import CcPerm from './CcPerm.vue'
const props = defineProps<{ page: PageSpec }>()
const route = useRoute()
const views: Record<string, any> = { cc_kyc: CcKyc, cc_review: CcReview, cc_creators: CcCreators, cc_invites: CcInvites, cc_revenue: CcRevenue, cc_withdraw: CcWithdraw, cc_spark: CcSpark, cc_cost: CcCost, cc_comp: CcComp, cc_config: CcConfig, cc_perm: CcPerm }
const comp = computed(() => (props.page.id === 'cc_review' && route.query.id ? CcReviewDetail : views[props.page.id]))
onMounted(() => loadPerms())
</script>
<template>
  <div v-if="!cc.loaded" style="padding:80px;text-align:center"><n-spin /></div>
  <n-result v-else-if="cc.err" status="warning" title="创作中心不可用" :description="cc.err" />
  <n-result v-else-if="!can(page.perm)" status="403" title="无权限" :description="`当前角色「${cc.role_name}」没有「${page.t}」(${page.perm}) 权限，请联系超级管理员在「创作中心权限」中分配。`" />
  <div v-else>
    <div class="cc-note">创作中心 · 操作仅写入 Studio 私有存储（SQLite/JSON），线上 MySQL 只读，不会改动线上剧库</div>
    <component :is="comp" :page="page" />
  </div>
</template>
<style scoped>
.cc-note{font-size:12px;color:#8a8a8a;margin:-6px 0 10px;display:flex;align-items:center;gap:6px}
.cc-note::before{content:'';width:6px;height:6px;border-radius:50%;background:#FF2C48;display:inline-block}
</style>
