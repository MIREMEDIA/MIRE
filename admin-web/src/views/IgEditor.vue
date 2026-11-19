<script setup lang="ts">
import { ref } from 'vue'
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { NCard, NAlert } from 'naive-ui'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import type { PageSpec } from '../menu'
defineProps<{ page: PageSpec }>()
const st = (c: string) => ({ background: c, color: '#fff', border: 'none', borderRadius: '8px', padding: '10px', width: '170px' })
const nodes = ref<any[]>([
  { id: '1', type: 'input', position: { x: 300, y: 0 }, data: { label: '开场：雨夜相遇' }, style: st('#101010') },
  { id: '2', position: { x: 80, y: 120 }, data: { label: '选择 A：递伞' }, style: st('#2B2B2B') },
  { id: '3', position: { x: 520, y: 120 }, data: { label: '选择 B：转身离开' }, style: st('#2B2B2B') },
  { id: '4', position: { x: 80, y: 250 }, data: { label: '剧情：身份揭晓（付费节点 60 积分）' }, style: st('#C8273C') },
  { id: '5', position: { x: 520, y: 250 }, data: { label: '剧情：三年后重逢' }, style: st('#2B2B2B') },
  { id: '6', type: 'output', position: { x: 0, y: 380 }, data: { label: '结局：HE 圆满' }, style: st('#FF2C48') },
  { id: '7', type: 'output', position: { x: 300, y: 380 }, data: { label: '结局：BE 错过' }, style: st('#7A7A7A') },
  { id: '8', type: 'output', position: { x: 600, y: 380 }, data: { label: '隐藏结局' }, style: st('#F5A524') },
])
const edges = ref<any[]>([
  { id: 'e1', source: '1', target: '2', label: 'A' }, { id: 'e2', source: '1', target: '3', label: 'B' },
  { id: 'e3', source: '2', target: '4', animated: true }, { id: 'e4', source: '3', target: '5' },
  { id: 'e5', source: '4', target: '6' }, { id: 'e6', source: '4', target: '7' }, { id: 'e7', source: '5', target: '7' }, { id: 'e8', source: '5', target: '8', animated: true },
])
</script>
<template>
  <n-card size="small" :title="page.t + ' · 剧情流程编辑器（演示）'">
    <n-alert type="warning" :show-icon="false" style="margin-bottom:10px">即将上线 · 只读预览：以下为示例剧情树，可拖拽/缩放体验，不会保存。</n-alert>
    <div style="height:520px;border:1px solid #eee;border-radius:8px"><VueFlow :nodes="nodes" :edges="edges" fit-view-on-init><Background /><Controls /></VueFlow></div>
  </n-card>
</template>
