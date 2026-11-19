/** Home interactive-games card. pending makes no availability claim; fail is not "coming soon". */
export type GamesEntry = 'pending' | 'live' | 'soon' | 'fail'

export function gamesEntryFromList(input: { code?: number; data?: { list?: unknown; total?: unknown } | null } | null): GamesEntry {
  if (!input || Number(input.code) !== 1 || !input.data || !Array.isArray(input.data.list)) return 'fail'
  const listed = input.data.list.length
  const total = Number(input.data.total)
  const n = Math.max(listed, Number.isFinite(total) ? total : 0)
  return n > 0 ? 'live' : 'soon'
}
