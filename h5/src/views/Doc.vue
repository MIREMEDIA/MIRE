<template><section class="scr"><div class="top"><span class="ic2" @click="$router.back()"><Icon name="back" /></span><h1>{{ label[$route.params.id as string] ? $t(label[$route.params.id as string]) : doc.title }}</h1></div>
  <div class="body"><div class="doc" v-html="html"></div></div></section></template>
<script setup lang="ts">
import Icon from '../components/Icon.vue'
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getInit, getRichtext } from '../api'
const route = useRoute(); const doc = ref<any>({ title: '' })
const label: Record<string, string> = { terms: 'me.terms', privacy: 'me.privacy', about: 'me.about', contact: 'me.contact', refund: 'me.refund' }
const keys: Record<string, string> = { terms: 'user_protocol', privacy: 'privacy_protocol', about: 'about_us', contact: 'contact_us', refund: 'legal_notice' }
// backend text still says ChillTV; show the brand name instead
const html = computed(() => String(doc.value.content || '').replace(/ChillTV|Chill TV/gi, 'MIRE DRAMA'))
// FE-M1 H-S2: the component is reused between /doc/terms and /doc/privacy, so reload whenever the id changes
// (onMounted only ran once, which left the terms text on the privacy page)
async function load(key: string) { doc.value = { title: '' }; const i = await getInit(); const id = i.data?.system?.[keys[key]] || key; const r = await getRichtext(id); if (route.params.id !== key) return; doc.value = r.data || { title: '' }; doc.value.title = String(doc.value.title || '').replace(/ChillTV/gi, 'MIRE DRAMA') }
watch(() => route.params.id as string, (k) => { if (k) load(k) }, { immediate: true })
</script>
