// B7 #4: share = navigator.share when available, else clipboard; a failed copy is reported as failed (never "copied")
export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed'
export async function copyText(s: string): Promise<boolean> {
  try { if (navigator.clipboard?.writeText && window.isSecureContext) { await navigator.clipboard.writeText(s); return true } } catch { /* fall through */ }
  try { const ta = document.createElement('textarea'); ta.value = s; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:-1000px;opacity:0'; document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return !!ok } catch { return false }
}
export async function shareOrCopy(url: string, title = ''): Promise<ShareResult> {
  const nav: any = navigator
  if (typeof nav.share === 'function') {
    try { await nav.share({ title, text: title, url }); return 'shared' } catch (e: any) { if (e?.name === 'AbortError') return 'cancelled' }
  }
  return (await copyText(url)) ? 'copied' : 'failed'
}
