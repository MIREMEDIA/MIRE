// FE-M1: display-side translations for English strings that arrive from the backend (category names,
// task titles, package flags / VIP descriptions, raw error messages). Only exact, known strings are mapped;
// anything else is shown unchanged. The backend should eventually return localized titles itself.
import { i18n } from './index'
import { t2s } from './zhcn'
const zhSrv: Record<string, string> = {
  'War': '戰爭', 'Sci-fi': '科幻', 'Idol': '偶像', 'Martial arts': '武俠', 'Romance': '愛情', 'Revenge': '復仇', 'Fantasy': '奇幻',
  'Comedy': '喜劇', 'Thriller': '驚悚', 'Urban': '都市', 'Family': '家庭', 'Mafia': '黑幫', 'Werewolf': '狼人', 'Rebirth': '重生', 'CEO': '霸總',
  'Historical': '古裝', 'Drama': '劇情', 'Action': '動作', 'Suspense': '懸疑', 'Youth': '青春', 'Sweet': '甜寵', 'Horror': '恐怖', 'Mystery': '懸疑',
  'Bind phone': '綁定手機', 'Bind email': '綁定郵箱', 'Complete registration': '完成註冊', 'Recharge any amount': '任意金額儲值',
  'Special offer': '限時優惠', 'Unrestricted playback': '不限次數播放', 'Best value': '最划算', 'Hot': '熱門', 'New': '新劇', 'Period': '年代', 'Documentary': '紀錄片',
  'Unrestricted playback, click to activate and enjoy better services.': '不限次數播放，開通即享更多權益。',
}
const zhErr: Record<string, string> = {
  'No results were found': '找不到這部劇，可能已下架', 'The current user is a guest': '登入狀態已失效，請重新登入',
}
const enErr: Record<string, string> = { 'No results were found': 'This drama is unavailable or has been removed.' }
const isZh = () => String(i18n.global.locale.value || '').startsWith('zh')
const cn = (v: string) => String(i18n.global.locale.value) === 'zh-CN' ? t2s(v) : v
/** translate a backend display string (category / task / flag / desc) for the current UI language */
export function st(s: any): string { const v = String(s ?? ''); if (!isZh()) return v; const h = zhSrv[v.trim()]; return h ? cn(h) : v }
/** friendly text for a backend error message; falls back to the generic "something went wrong" */
export function errText(msg: any, fallback: string): string {
  const m = String(msg ?? '').trim(); if (!m) return fallback
  const tbl = isZh() ? zhErr : enErr; const k = Object.keys(tbl).find(x => m.startsWith(x))
  if (k) return isZh() ? cn(tbl[k]) : tbl[k]
  return /[A-Za-z]{4,}/.test(m) && isZh() ? fallback : m
}
const en = { loadFail: 'Could not load. Please try again.', loginAgain: 'Your session has expired. Please sign in again.', notFound: 'This drama is unavailable or has been removed.', home: 'Back to home', privacyLoading: 'Loading…', codeSent: 'Verification code sent to {a}. Please check your inbox.', pwdSaved: 'Password saved.' }
const zh = { loadFail: '載入失敗，請稍後重試。', loginAgain: '登入狀態已失效，請重新登入。', notFound: '找不到這部劇，可能已下架。', home: '回到首頁', privacyLoading: '載入中…', codeSent: '驗證碼已發送至 {a}，請查收。', pwdSaved: '密碼已設定成功。' }
i18n.global.mergeLocaleMessage('en', { fem1: en }); i18n.global.mergeLocaleMessage('zh-TW', { fem1: zh })
