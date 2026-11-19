<script setup lang="ts">
import { isMobile } from '../mobile'  // FE-M4: 窄屏单列，避免标签被挤成竖排
import MTable from '../components/MTable.vue'
import { NCard, NResult, NTag, NDescriptions, NDescriptionsItem, NSpace } from 'naive-ui'
import type { PageSpec } from '../menu'
const props = defineProps<{ page: PageSpec }>()
const name = (x: any) => (typeof x === 'string' ? x : x?.t || x?.label || x?.name || x?.[0] || JSON.stringify(x))
const cols = (props.page.cols || []).map((c: any, i: number) => ({ title: name(c), key: 'c' + i }))
</script>
<template>
  <n-card size="small">
    <n-result status="info" title="即将上线 · 只读预览" :description="`「${page.t}」已在新架构中规划，v0.1 暂未接入后端数据。`">
      <template #icon><div style="font-size:54px;color:#FF2C48">◆</div></template>
    </n-result>
    <n-descriptions bordered size="small" :column="isMobile ? 1 : 3" label-placement="left" style="margin-top:8px">
      <n-descriptions-item label="所属模块">{{ page.g }}<template v-if="page.s"> / {{ page.s }}</template></n-descriptions-item>
      <n-descriptions-item label="迁移策略"><n-tag size="small" :type="page.st === '新增' ? 'error' : page.st === '合并' ? 'warning' : 'success'" :bordered="false">{{ page.st || '—' }}</n-tag></n-descriptions-item>
      <n-descriptions-item label="旧版路径">{{ page.old || '—' }}</n-descriptions-item>
      <n-descriptions-item v-if="page.note" label="说明" :span="isMobile ? 1 : 3">{{ page.note }}</n-descriptions-item>
    </n-descriptions>
    <template v-if="cols.length">
      <div class="muted" style="margin:16px 0 8px">列表字段预览</div>
      <m-table :columns="cols" :data="[]" size="small" />
    </template>
    <template v-if="page.fields?.length">
      <div class="muted" style="margin:16px 0 8px">表单字段预览</div>
      <n-space><n-tag v-for="(f, i) in page.fields" :key="i" :bordered="false">{{ name(f) }}</n-tag></n-space>
    </template>
  </n-card>
</template>
