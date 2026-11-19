<template><svg :class="'i-' + name" :width="size" :height="size" viewBox="0 0 24 24" :fill="fill ? 'currentColor' : 'none'" stroke="currentColor" :stroke-width="fill ? 0 : 2" stroke-linecap="round" stroke-linejoin="round" v-html="P[name]"></svg></template>
<script setup lang="ts">
withDefaults(defineProps<{ name: string; size?: number; fill?: boolean }>(), { size: 24 })
const P: Record<string, string> = {
  chat: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5z"/>',
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  play: '<path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z"/>',
  shorts: '<rect x="5" y="2.5" width="14" height="19" rx="3"/><path d="m10 9 5 3-5 3z"/>',
  list: '<path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8M12 8v13M12 8S10.5 3 7.8 3.6C5.6 4.1 6.6 8 12 8zm0 0s1.5-5 4.2-4.4C18.4 4.1 17.4 8 12 8z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/>',
  heart: '<path d="M12 21s-8-5.2-8-11.2A4.8 4.8 0 0 1 12 7a4.8 4.8 0 0 1 8 2.8C20 15.8 12 21 12 21z"/>',
  eps: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  share: '<path d="M14 4l7 7-7 7v-4c-5 0-8.5 1.6-11 5 1-5 4-10 11-11z"/>',
  back: '<path d="m15 5-7 7 7 7"/>', right: '<path d="m9 5 7 7-7 7"/>', plus: '<path d="M12 5v14M5 12h14"/>', check: '<path d="m5 12 5 5 9-10"/>',
  lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  crown: '<path d="m3 7 4.5 4L12 4l4.5 7L21 7l-2 12H5z"/>', fire: '<path d="M12 22c4.4 0 7-2.9 7-6.8 0-4.3-3.4-6.2-4.4-10.2-2.4 1.4-3.6 3.7-3.4 6-1.5-.7-2.4-2.1-2.4-3.8C6.6 9 5 11.6 5 15.2 5 19.1 7.6 22 12 22z"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M14.8 9.2A3 3 0 0 0 12 8c-1.7 0-3 .9-3 2s1.3 1.6 3 2 3 .9 3 2-1.3 2-3 2a3 3 0 0 1-2.8-1.2M12 6v2M12 16v2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', wallet: '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M16 15h2"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>', help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.7M12 17h.01"/>',
  doc: '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>', logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4"/>', mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>', tv: '<rect x="3" y="5" width="18" height="13" rx="2"/><path d="M8 21h8"/>',
}
</script>
