<template>
  <section class="scr">
    <div class="top"><h1>{{ $t('m3.games.title') }}</h1></div>
    <div class="body" style="padding:0 16px 40px">
      <p v-if="err" class="oerr">{{ err }}<br /><button class="btn gob" @click="load">{{ $t('common.retry') }}</button></p>
      <p v-else-if="loading" class="note" style="text-align:center;padding:40px">{{ $t('common.loading') }}</p>
      <p v-else-if="!list.length" class="note" style="text-align:center;padding:40px">{{ $t('m3.games.empty') }}</p>
      <div v-else class="ggrid" data-t="games-list">
        <div v-for="g in list" :key="g.id" class="gcard" @click="$router.push(`/game/${g.id}`)">
          <div class="gcover"><img :src="g.cover" loading="lazy" decoding="async" alt="" /><span v-if="g.price === 0" class="gbadge free">{{ $t('m3.games.free') }}</span><span v-else-if="g.unlocked || g.canPlay" class="gbadge ok">{{ $t('m3.games.unlocked') }}</span><span v-else-if="g.vipFree || g.vprice === 0" class="gbadge vip">{{ $t('m3.games.vipFree') }}</span></div>
          <b class="gt">{{ g.title }}</b>
          <p class="gs">{{ g.summary }}</p>
          <div class="gmeta"><span v-if="g.price > 0">🪙 {{ g.price }}</span><span v-else>{{ $t('m3.games.free') }}</span><span v-if="g.hot">🔥 {{ compact(g.hot) }}</span></div>
        </div>
      </div>
    </div>
  </section>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { listGames, type GameItem } from '../api/games'
import { compact } from '../utils'
defineOptions({ name: 'Games' })
const { t } = useI18n()
const list = ref<GameItem[]>([])
const loading = ref(true)
const err = ref('')
async function load() {
  loading.value = true; err.value = ''
  try {
    const r = await listGames()
    if (r.code === 1) list.value = r.data?.list || []
    else err.value = r.msg || t('m3.games.loadFail')
  } catch { err.value = t('m3.games.loadFail') }
  finally { loading.value = false }
}
onMounted(load)
</script>
