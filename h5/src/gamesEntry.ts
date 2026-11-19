/** Home interactive-games card. Copy follows the list the games page actually loads. */
export type GamesEntry = 'unknown' | 'live' | 'soon'

export function gamesEntryState(count: number | null): GamesEntry {
  if (count == null || !Number.isFinite(count)) return 'unknown'
  return count > 0 ? 'live' : 'soon'
}
