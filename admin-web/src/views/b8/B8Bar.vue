<script setup lang="ts">
// B8 page header: title + language toggle + read-only banner (shared by all B8 views)
import { NAlert, NButton } from 'naive-ui'
import { t, toggleLang } from '../../b8i18n'
import { roReason } from '../../ro'
const isEn = localStorage.getItem('mire_lang') === 'en'
// FE-M6：原因只看后端字段——db=false（后端 db_writable/env_writable）才说库不可写，否则是账号无写入权限
withDefaults(defineProps<{ title: string; writable?: boolean | null; hint?: string; reason?: string; db?: boolean | null }>(), { writable: null, hint: '', reason: '', db: null })
</script>
<template>
  <div class="b8-bar"><h2>{{ title }}</h2><!-- FE-M1 A-G3：后台统一简体中文，只在已切到英文时显示「中文」按钮用于切回 -->
  <n-button v-if="isEn" size="small" quaternary data-b8="lang" @click="toggleLang">{{ t('b8.lang') }}</n-button></div>
  <n-alert v-if="writable === false" type="warning" :bordered="false" data-b8="readonly">{{ reason || roReason(writable, db) }}</n-alert>
  <p v-if="hint" class="muted b8-hint">{{ hint }}</p>
</template>
<style scoped>
.b8-bar{display:flex;align-items:center;justify-content:space-between;gap:8px}
.b8-bar h2{margin:0;font-size:20px}
.b8-hint{margin:0;font-size:13px}
</style>
