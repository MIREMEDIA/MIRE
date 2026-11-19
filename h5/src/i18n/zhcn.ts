// FE-M1 H-M1：提供 zh-CN（简体）界面语言，内容由 zh-TW 文案自动转换，并跟随后续 mergeLocaleMessage 同步。
import { T, S, PHRASES } from './zhcn_map'
const MAP: Record<string, string> = {}; for (let i = 0; i < T.length; i++) MAP[T[i]] = S[i]
export function t2s(s: string): string { let o = ''; for (const c of s) o += MAP[c] || c; for (const [a, b] of PHRASES) o = o.split(a).join(b); return o }
const conv = (v: any): any => typeof v === 'string' ? t2s(v) : Array.isArray(v) ? v.map(conv) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, conv(x)])) : v
export function installZhCN(g: any) {
  const merge = g.mergeLocaleMessage.bind(g)
  g.setLocaleMessage('zh-CN', conv(JSON.parse(JSON.stringify(g.getLocaleMessage('zh-TW')))))
  g.mergeLocaleMessage = (loc: string, m: any) => { merge(loc, m); if (loc === 'zh-TW') merge('zh-CN', conv(JSON.parse(JSON.stringify(m)))) }
}
