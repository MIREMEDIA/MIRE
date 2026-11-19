<template><section class="scr">
  <div class="top"><span class="ic2" @click="$router.back()"><Icon name="back" /></span><h1>{{ $t('lang.title') }}</h1></div>
  <p class="note" style="margin:0 16px 8px">{{ $t('lang.desc') }}</p>
  <div class="body lang"><div v-for="l in LANGS" :key="l.code" :class="{ on: locale === l.code }" @click="pickUi(l.code)">{{ l.name }}<span>{{ locale === l.code ? '✓' : '' }}</span></div></div>
  <template v-if="srv.length > 1">
    <p class="note" style="margin:16px 16px 8px">{{ $t('b7.lang.content') }} · {{ $t('b7.lang.follow') }}</p>
    <div class="body lang"><div v-for="l in srv" :key="l.lang" :class="{ on: cur === l.lang }" @click="pick(l.lang)">{{ l.lang_text || l.lang_cn || l.lang }}<span>{{ cur === l.lang ? '✓' : '' }}</span></div></div>
  </template></section></template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Icon from '../components/Icon.vue'
import { useI18n } from 'vue-i18n'
import { LANGS, setLang } from '../i18n'
import { getLangList } from '../api'
import { CONTENT_LANG } from '../api/http'
import { contentLangFor } from '../api/b7Core'
const { locale } = useI18n()
// B1 #24: content languages = vs_lang rows (admin "语种管理"); picking one reloads with that Lang header
const srv = ref<any[]>([]); const cur = ref(CONTENT_LANG)
onMounted(async () => { if (!(window as any).MIRE_CONFIG?.serverLangs) return; try { const r = await getLangList(); srv.value = Array.isArray(r.data) ? r.data : [] } catch {} })
// B7 #10: UI and content language move together (no more Arabic UI over Traditional-Chinese titles or vice versa)
function pickUi(code: string) { setLang(code); if (!srv.value.length) return; const c = contentLangFor(code, srv.value); if (c && c !== cur.value) { localStorage.setItem('mire_content_lang', c); location.reload() } }
function pick(code: string) { if (code === cur.value) return; const ui = LANGS.find(l => contentLangFor(l.code, [{ lang: code }]) === code); if (ui) setLang(ui.code); localStorage.setItem('mire_content_lang', code); location.reload() }
</script>
