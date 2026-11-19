<script setup lang="ts">
// FE-M4: 列表/页面首屏骨架（数据未返回前替代空白或「无数据」）
import { NSkeleton } from 'naive-ui'
withDefaults(defineProps<{ rows?: number }>(), { rows: 6 })
const txt = localStorage.getItem('mire_lang') === 'en' ? 'Loading…' : '加载中…'
</script>
<template>
  <div class="pl" data-page-loading aria-busy="true">
    <div class="pl-t">{{ txt }}</div>
    <n-skeleton v-for="i in rows" :key="i" text :height="18" style="margin:8px 0" :width="i % 3 === 0 ? '60%' : '100%'" />
  </div>
</template>
<style scoped>.pl{padding:8px 0}.pl-t{color:#999;font-size:12px;margin-bottom:4px}</style>
