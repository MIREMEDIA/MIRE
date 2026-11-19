// B15: first-purchase VIP price. The server decides eligibility (/vip/index -> first_eligible, per item first_available /
// pay_price). The H5 never infers eligibility itself: no first_eligible === true -> show and charge the normal price.
export type VipItem = { id: number; price: string | number; first_price?: string | number | null; first_available?: boolean; pay_price?: string | number | null; [k: string]: any }

/** server flag, strictly boolean true (older backends without the field -> false) */
export const firstEligible = (data: any): boolean => data?.first_eligible === true

/** is the first-purchase price on for this plan, given the server's eligibility */
export function isFirst(v: VipItem | null | undefined, eligible: boolean): boolean {
  if (!v || !eligible) return false
  if (v.first_available === false) return false
  const fp = Number(v.first_price)
  return Number.isFinite(fp) && fp > 0
}

/** amount to show and to send as total_fee (must equal what the server charges) */
export function effectivePrice(v: VipItem, eligible: boolean): string {
  if (eligible && v.pay_price != null && v.pay_price !== '') return String(v.pay_price)
  return String(isFirst(v, eligible) ? v.first_price : v.price)
}
