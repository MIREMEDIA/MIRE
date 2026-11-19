import base from './vite.config'
import { defineConfig, type Plugin } from 'vite'

const cover = (label: string, c1: string, c2: string) =>
  'data:image/svg+xml,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="480"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="360" height="480" fill="url(#g)"/><text x="180" y="250" text-anchor="middle" fill="#fff" font-size="28" font-family="sans-serif">${label}</text></svg>`
  )

const roti = {
  id: 42,
  title: 'RotiDanEmas',
  image: cover('Roti', '#3a2010', '#e0a050'),
  episodes: 12,
  hots: '3200',
  category_text_arr: ['Drama'],
}

const stagingRoti = {
  id: 's7',
  title: 'Roti Dan Emas',
  image: cover('Staging', '#102030', '#3070c0'),
  episodes: 8,
  hots: '80',
  category_text_arr: ['Staging'],
}

const games = [
  { id: 1, title: 'QA Shadow Path', image: cover('Shadow', '#102a1a', '#2fd27f'), description: 'IG MVP seed #1 — free.', price: 0, vprice: 0, views: 100, unlocked: 1, vip_free: 0, can_play: 1, need_pay: 0 },
  { id: 2, title: 'QA Coin Gate', image: cover('Coin', '#3a0a14', '#C8273C'), description: 'IG MVP seed #2 — priced.', price: 30, vprice: 0, views: 50, unlocked: 0, vip_free: 1, can_play: 0, need_pay: 1 },
  { id: 3, title: 'QA VIP Lane', image: cover('VIP', '#3a2a12', '#e0a800'), description: 'IG MVP seed #3 — priced.', price: 40, vprice: 0, views: 40, unlocked: 0, vip_free: 1, can_play: 0, need_pay: 1 },
]

function send(res: import('http').ServerResponse, data: unknown) {
  res.statusCode = 200
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.end(JSON.stringify({ code: 1, msg: 'ok', data }))
}

function fixture(): Plugin {
  return {
    name: 'local-readonly-fixture',
    transformIndexHtml(html) {
      // Local reproduction only. Production index.html is unchanged; this flag is not a secret.
      return html.replace('stagingLibrary:true,', 'stagingLibrary:true,\n  gamesApi:1,')
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const raw = req.url || ''
        if (!raw.startsWith('/fa/') && !raw.startsWith('/h5api/')) return next()
        const u = new URL(raw, 'http://127.0.0.1')
        if (u.pathname.includes('/ig/index')) return send(res, games)
        if (u.pathname.includes('/video/index')) {
          const search = u.searchParams.get('search')
          if (search == null || search === '' || search === 'RotiDanEmas') return send(res, [roti])
          return send(res, [])
        }
        if (u.pathname.includes('/index/home')) return send(res, { must: [roti], news: [], top: [roti] })
        if (u.pathname.includes('/index/init')) return send(res, { system: { name: 'MIRE DRAMA' }, payment: [] })
        if (u.searchParams.get('r') === 'library.list') return send(res, [stagingRoti])
        if (u.pathname.includes('/category/index')) return send(res, [{ id: 1, name: 'All', children: [] }])
        return send(res, [])
      })
    },
  }
}

export default defineConfig({
  ...base,
  server: { host: '127.0.0.1', port: 5174, strictPort: true },
  plugins: [...(base.plugins ?? []), fixture()],
})
