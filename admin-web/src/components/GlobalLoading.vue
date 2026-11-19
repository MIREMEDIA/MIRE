<script setup lang="ts">
// FE-M4: 全局加载指示（不改 Layout.vue）：有请求或页面 chunk 在加载时顶部出现进度条；超过 600ms 右下角出现「加载中…」
import { busy, loadState } from '../loading'
const txt = localStorage.getItem('mire_lang') === 'en' ? 'Loading…' : '加载中…'
</script>
<template>
  <div v-show="busy" class="gl-bar" data-global-loading role="progressbar" aria-busy="true"><i /></div>
  <div v-if="loadState.slow" class="gl-pill" data-global-loading-pill>{{ txt }}</div>
</template>
<style scoped>
.gl-bar{position:fixed;left:0;right:0;top:0;height:3px;z-index:3000;overflow:hidden;background:rgba(255,44,72,.15)}
.gl-bar i{position:absolute;top:0;bottom:0;width:40%;background:#FF2C48;animation:gl 1.1s ease-in-out infinite}
@keyframes gl{0%{left:-40%}100%{left:100%}}
.gl-pill{position:fixed;right:16px;bottom:16px;z-index:3000;background:rgba(30,30,30,.82);color:#fff;font-size:12px;padding:6px 12px;border-radius:14px;pointer-events:none}
</style>
