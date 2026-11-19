import { ref } from 'vue'
export const toastMsg = ref('')
let t: any
export function toast(m: string, ms = 1800) { toastMsg.value = m; clearTimeout(t); t = setTimeout(() => (toastMsg.value = ''), ms) }
/** B16: pay failures stay readable longer */
export const toastPay = (m: string) => toast(m, 4500)
export function clearToast() { clearTimeout(t); toastMsg.value = '' }
