/** "18303.75K" -> "18.3M" */
export function compact(v?: string | number) { if (v == null || v === '') return ''; let n = typeof v === 'number' ? v : parseFloat(v); const s = String(v); if (/k$/i.test(s)) n *= 1e3; if (/m$/i.test(s)) n *= 1e6; if (!isFinite(n)) return s
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n) }
/** Same price string in every UI language: always 2 decimals + currency code, en number format. */
export function money(v: string | number, cur = 'USD') { return `${cur} ${Number(v).toFixed(2)}` }
export const cleanTitle = (t = '') => t.replace(/-en$/i, '').replace(/([a-z])([A-Z])/g, '$1 $2')
