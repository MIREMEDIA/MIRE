// Mobile layout switch (<768px), same breakpoint as MIRE Studio's phone layout.
import { ref } from 'vue'
export const MOBILE_QUERY = '(max-width: 767px)'
const mq = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(MOBILE_QUERY) : null
export const isMobile = ref(!!mq?.matches)
mq?.addEventListener?.('change', e => { isMobile.value = e.matches })
export function useIsMobile() { return isMobile }
