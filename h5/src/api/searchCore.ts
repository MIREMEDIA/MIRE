/**
 * Search contract used by the H5 client (PHP api/ is not in this tree):
 *   GET {apiBase}/addons/dramas/video/index?search=&page=&pagesize=
 *   apiBase = MIRE_CONFIG.apiBase, else VITE_API_BASE, else '' (same origin)
 *   Headers from request(): Lang, Platform=H5, Token, Channel
 * Home and Discover render cleanTitle(title). cleanTitle inserts spaces into
 * camelCase and strips a trailing -en, so the string on screen can differ from
 * the stored title the catalog search matches.
 * Staging rows shown on Home come from GET {companionApi}/index.php?r=library.list
 * when both MIRE_CONFIG.stagingLibrary and companionApi are set. They are not
 * part of /video/index.
 * assembleSearchResults only returns rows from the arrays it is given.
 */

export function asDramaList(data: unknown): any[] {
  return Array.isArray(data) ? data.filter(Boolean) : []
}

export function compactQuery(query: string): string {
  return String(query || '').trim().replace(/\s+/g, '')
}

/** Same display rewrite as utils.cleanTitle, kept local so this file stays free of extensionless imports. */
export function shownTitle(title: string): string {
  return String(title || '').replace(/-en$/i, '').replace(/([a-z])([A-Z])/g, '$1 $2')
}

export function normShown(title: string): string {
  return shownTitle(title).toLowerCase().replace(/\s+/g, ' ').trim()
}

/** True when the query matches the raw title or the title Home/Discover display. */
export function titleMatchesQuery(title: string, query: string): boolean {
  const q = normShown(query)
  if (!q) return false
  const shown = normShown(title)
  const raw = String(title || '').toLowerCase().trim()
  const squash = (s: string) => s.replace(/\s+/g, '')
  return shown.includes(q) || raw.includes(q) || squash(shown).includes(squash(q))
}

export function assembleSearchResults(query: string, parts: { primary: unknown; variant?: unknown; staging?: unknown }): any[] {
  const q = String(query || '').trim()
  if (!q) return []
  const primary = asDramaList(parts.primary)
  const variant = asDramaList(parts.variant).filter(d => titleMatchesQuery(d.title || d.name || '', q))
  const staging = asDramaList(parts.staging).filter(d => titleMatchesQuery(d.title || d.name || '', q))
  const seen = new Set<string>()
  const out: any[] = []
  for (const d of [...primary, ...variant, ...staging]) {
    const id = d?.id == null ? '' : String(d.id)
    if (!id || seen.has(id)) continue
    seen.add(id)
    out.push(d)
  }
  return out
}
