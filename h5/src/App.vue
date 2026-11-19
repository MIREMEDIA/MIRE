<template>
  <div id="frame">
    <router-view v-slot="{ Component }"><keep-alive include="Home,Discover"><component :is="Component" /></keep-alive></router-view>
    <TabBar v-if="route.meta.tab" :dark="!!route.meta.dark" />
    <div class="toast" role="alert" data-t="toast" v-if="toastMsg">{{ toastMsg }}</div>
  </div>
</template>
<script setup lang="ts">
import { useRoute } from 'vue-router'
import TabBar from './components/TabBar.vue'
import { toastMsg } from './components/toast'
import { loadBrand } from './brand'
loadBrand()
const route = useRoute()
</script>
