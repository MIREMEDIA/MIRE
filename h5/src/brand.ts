// B1 #35: site name comes from the backend (/index/init -> system.name, edited in the admin "站点信息").
import { ref } from 'vue'
import { getInit } from './api'
const cfg = (window as any).MIRE_CONFIG || {}
export const brand = ref('MIRE DRAMA')
export async function loadBrand() {
  if (!cfg.brandFromInit) return
  try { const r = await getInit(); const n = String(r.data?.system?.name || '').trim(); if (n) { brand.value = n; document.title = n } } catch {}
}
