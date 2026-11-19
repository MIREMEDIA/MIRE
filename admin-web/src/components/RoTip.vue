<script setup lang="ts">
// FE-M6：包住可能置灰的写按钮。reason 非空时：title 提示（桌面悬停）+ 点击/轻触弹出原因（手机）。
// 置灰按钮本身收不到点击（disabled），CSS 让点击落到外层 span。
import { useMessage } from 'naive-ui'
const p = defineProps<{ reason?: string }>()
const msg = useMessage()
function tap(e: Event) { if (!p.reason) return; e.stopPropagation(); e.preventDefault(); msg.warning(p.reason, { duration: 3000 }) }
</script>
<template>
  <span v-if="reason" class="ro-tip" :title="reason" :aria-label="reason" role="note" data-ro-tip @click="tap"><slot /></span>
  <slot v-else />
</template>
<style>
.ro-tip{display:inline-flex;cursor:help;-webkit-touch-callout:none}
.ro-tip .n-button--disabled,.ro-tip button[disabled]{pointer-events:none}
</style>
