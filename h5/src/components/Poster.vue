<template><div class="pc" @click="$router.push(`/play/${d.id}`)">
  <div class="pi"><img :src="d.image" loading="lazy" referrerpolicy="no-referrer" @error="($event.target as HTMLImageElement).style.opacity='0'" />
    <span v-if="tag" class="rib" :class="tag.toLowerCase()">{{ $te('b7.tag.' + tag.toLowerCase()) ? $t('b7.tag.' + tag.toLowerCase()) : tag }}</span>
    <span class="views" v-if="d.hots || d.views"><Icon name="play" :size="10" fill />{{ compact(d.hots || d.views) }}</span>
    <span class="epc">{{ $t('common.eps', { n: d.episodes }) }}</span>
    <b v-if="rank" class="rk" :class="'r' + rank">{{ rank }}</b>
  </div>
  <div class="pt">{{ cleanTitle(d.title) }}</div><div class="pg" v-if="genre && d.category_text_arr?.length">{{ d.category_text_arr.slice(0, 2).map($st).join(' · ') }}</div>
</div></template>
<script setup lang="ts">
import { cleanTitle, compact } from '../utils'
import Icon from './Icon.vue'
defineProps<{ d: any; tag?: string; rank?: number; genre?: boolean }>()
</script>
