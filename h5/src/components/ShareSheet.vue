<template><Sheet v-model="open"><div class="pwh"><h3>{{ $t('b7.share.title') }}</h3><span class="x" @click="open = false">✕</span></div>
  <p class="sub">{{ $t('b7.share.manual') }}</p>
  <textarea ref="ta" class="sharebox" readonly :value="url" @focus="sel" @click="sel"></textarea>
  <div class="row2b"><button class="btn" @click="again">{{ $t('b7.share.copy') }}</button></div>
</Sheet></template>
<script setup lang="ts">
// Manual-copy fallback: shown when navigator.share is missing/failed AND clipboard copy failed. Long-press the box to copy.
import { ref, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import Sheet from './Sheet.vue'
import { toast } from './toast'
import { shareOrCopy, copyText, type ShareResult } from '../api/share'
const { t } = useI18n(); const open = ref(false); const url = ref(''); const ta = ref<HTMLTextAreaElement>()
const sel = () => { ta.value?.select(); ta.value?.setSelectionRange(0, url.value.length) }
async function again() { if (await copyText(url.value)) { toast(t('common.copied')); open.value = false } else { sel(); toast(t('b7.share.longPress')) } }
/** returns the result; 'shared' | 'copied' count as success for the share task */
async function share(u: string, title = ''): Promise<ShareResult> {
  url.value = u; const r = await shareOrCopy(u, title)
  if (r === 'copied') toast(t('common.copied')); else if (r === 'shared') toast(t('b7.share.done'))
  else if (r === 'failed') { open.value = true; await nextTick(); sel(); toast(t('b7.share.copyFail')) }
  return r
}
defineExpose({ share, open })
</script>
