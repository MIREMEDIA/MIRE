// B7 #1 watch-ad unlock: FA /ad/add and /ad/commit take `data` = RSA(PKCS#1 v1.5) of base64(JSON), url-safe base64,
// decrypted server-side with addons/dramas/library/data/private_key.pem (Ad.php paramsDecrypt). WebCrypto has no
// RSAES-PKCS1-v1_5, so this is a small BigInt implementation. The PUBLIC key comes from MIRE_CONFIG.adPublicKey
// (never hard-coded here); without it the ad option is shown as "not configured".
const b64d = (s: string) => Uint8Array.from(atob(s.replace(/-----[^-]+-----|\s+/g, '')), c => c.charCodeAt(0))
const b64e = (u: Uint8Array) => { let s = ''; u.forEach(b => (s += String.fromCharCode(b))); return btoa(s) }
export const urlSafe = (b64: string) => b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
export const utf8b64 = (s: string) => b64e(new TextEncoder().encode(s))
function der(u: Uint8Array, p: number): { tag: number; len: number; start: number } {
  const tag = u[p]; let len = u[p + 1]; let start = p + 2
  if (len & 0x80) { const n = len & 0x7f; len = 0; for (let i = 0; i < n; i++) len = len * 256 + u[start + i]; start += n }
  return { tag, len, start }
}
const toBig = (u: Uint8Array) => { let x = 0n; u.forEach(b => (x = (x << 8n) | BigInt(b))); return x }
/** SPKI ("BEGIN PUBLIC KEY") or PKCS#1 ("BEGIN RSA PUBLIC KEY") PEM -> {n, e, k} */
export function parsePublicKey(pem: string): { n: bigint; e: bigint; k: number } {
  let u = b64d(pem)
  let s = der(u, 0) // outer SEQUENCE
  let f = der(u, s.start)
  if (f.tag === 0x30) { // SPKI: SEQUENCE{algId} BIT STRING{ RSAPublicKey }
    const bit = der(u, f.start + f.len); u = u.slice(bit.start + 1, bit.start + bit.len); s = der(u, 0); f = der(u, s.start)
  }
  const nT = f; const eT = der(u, nT.start + nT.len)
  let nb = u.slice(nT.start, nT.start + nT.len); while (nb[0] === 0 && nb.length > 1) nb = nb.slice(1)
  return { n: toBig(nb), e: toBig(u.slice(eT.start, eT.start + eT.len)), k: nb.length }
}
function modpow(b: bigint, e: bigint, m: bigint) { let r = 1n; b %= m; while (e > 0n) { if (e & 1n) r = r * b % m; e >>= 1n; b = b * b % m } return r }
/** RSAES-PKCS1-v1_5 encrypt; returns standard base64 */
export function rsaEncrypt(pem: string, msg: Uint8Array, rnd: (n: number) => Uint8Array = n => crypto.getRandomValues(new Uint8Array(n))): string {
  const { n, e, k } = parsePublicKey(pem)
  if (msg.length > k - 11) throw new Error('rsa: message too long')
  const ps = new Uint8Array(k - 3 - msg.length); let i = 0
  while (i < ps.length) { const r = rnd(ps.length - i); for (const b of r) if (b !== 0 && i < ps.length) ps[i++] = b }
  const em = new Uint8Array(k); em[1] = 2; em.set(ps, 2); em.set(msg, 3 + ps.length)
  let c = modpow(toBig(em), e, n); const out = new Uint8Array(k)
  for (let j = k - 1; j >= 0; j--) { out[j] = Number(c & 0xffn); c >>= 8n }
  return b64e(out)
}
/** FA ad payload: urlsafe(base64(RSA(base64(JSON)))) */
export const adPayload = (pem: string, obj: Record<string, any>) => urlSafe(rsaEncrypt(pem, new TextEncoder().encode(utf8b64(JSON.stringify(obj)))))
