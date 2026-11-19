<script setup lang="ts">
import { NConfigProvider, NMessageProvider, NDialogProvider, zhCN, dateZhCN, enUS, dateEnUS, type GlobalThemeOverrides } from 'naive-ui'
import GlobalLoading from './components/GlobalLoading.vue'
const theme: GlobalThemeOverrides = {
  common: { primaryColor: '#FF2C48', primaryColorHover: '#FF4D66', primaryColorPressed: '#C8273C', primaryColorSuppl: '#FF2C48',
    warningColor: '#F5A524', borderRadius: '6px', fontFamily: 'Poppins, "Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", sans-serif' },
  Menu: { itemColorActive: '#FF2C48', itemColorActiveHover: '#FF2C48', itemTextColorActive: '#fff', itemIconColorActive: '#fff',
    itemTextColorActiveHover: '#fff', itemColorActiveCollapsed: '#FF2C48', itemTextColorChildActive: '#FF2C48', arrowColorChildActive: '#FF2C48' },
}
const en = localStorage.getItem('mire_lang') === 'en' // B8: Naive UI 内置文案（无数据/分页等）跟随后台语言
</script>
<template>
  <n-config-provider :theme-overrides="theme" :locale="en ? enUS : zhCN" :date-locale="en ? dateEnUS : dateZhCN">
    <n-message-provider><n-dialog-provider><router-view /></n-dialog-provider></n-message-provider>
    <GlobalLoading />
  </n-config-provider>
</template>
