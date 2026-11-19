<template><Sheet v-model="open"><div class="pwh"><h3>{{ $t('b7.ad.title') }}</h3><span class="x" @click="close">✕</span></div>
  <p v-if="state === 'nokey'" class="sub">{{ $t('b7.ad.nokey') }}</p>
  <p v-else-if="state === 'loading'" class="sub">{{ $t('common.loading') }}</p>
  <p v-else-if="state === 'none'" class="sub" data-b9="ad-none">{{ msg || $t('b7.ad.none') }}</p>
  <template v-else>
    <div class="adbox"><video v-if="ad?.video" :src="ad.video" playsinline autoplay muted @click="ad?.link && openLink()"></video><img v-else-if="ad?.image" :src="ad.image" @click="ad?.link && openLink()" /><b v-else>{{ ad?.title }}</b></div>
    <p class="sub">{{ left > 0 ? $t('b7.ad.wait', { n: left }) : (state === 'done' ? $t('b7.ad.ok') : '') }}</p>
    <button class="btn" :disabled="left > 0 || state === 'sending' || state === 'done'" @click="claim">{{ type === 'unlock' ? $t('b7.ad.unlock') : $t('b7.ad.claim', { n: ad?.usable || '' }) }}</button>
  </template>
</Sheet></template>
<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import Sheet from './Sheet.vue'
import { toast } from './toast'
import { adConfigured, loadAd, finishAd, type AdInfo } from '../api/ad'
const emit = defineEmits<{ done: [] }>()
// B9 #5: FA no_ad (no row for this lang and none to fall back to) or the old bare "Operation failed" -> localized "no ad"; other msgs (rule limits) shown as-is
const adNoneMsg = (r: any) => r?.data?.reason === 'order' ? t('b10.ad.order', { n: r.data.need_name || r.data.need_index || '' }) : (r?.data?.reason === 'no_ad' || !r?.msg || /^(operation failed|操作失败|操作失敗)[.!。]?$/i.test(String(r.msg).trim()) ? '' : String(r.msg))
const { t } = useI18n(); const open = ref(false); const state = ref<'nokey' | 'loading' | 'none' | 'watch' | 'sending' | 'done'>('loading'); const msg = ref('')
const ad = ref<AdInfo | null>(null); const left = ref(0); const type = ref<'usable' | 'unlock'>('usable'); let vid = 0; let ep = 0; let tm: any
const openLink = () => window.open(ad.value!.link, '_blank', 'noopener')
function close() { clearInterval(tm); open.value = false }
async function start(tp: 'usable' | 'unlock', v = 0, e = 0) {
  type.value = tp; vid = v; ep = e; open.value = true; msg.value = ''; clearInterval(tm)
  if (!adConfigured()) { state.value = 'nokey'; return }
  state.value = 'loading'; const { r, ad: a } = await loadAd(tp, v, e); if (!a) { state.value = 'none'; msg.value = adNoneMsg(r); return }
  ad.value = a; left.value = a.seconds; state.value = 'watch'; tm = setInterval(() => { if (--left.value <= 0) clearInterval(tm) }, 1000)
}
async function claim() { if (!ad.value) return; state.value = 'sending'; const r = await finishAd(ad.value, type.value, vid, ep)
  if (r.code === 1) { state.value = 'done'; toast(r.msg || t('b7.ad.ok')); emit('done'); setTimeout(close, 600) } else { state.value = 'watch'; toast(r.msg || t('b7.fail')) } }
onUnmounted(() => clearInterval(tm))
defineExpose({ start })
</script>
