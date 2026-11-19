// B9 page copy (zh / en): 打赏配置 / 提现币种与汇率. Same mechanism as b8i18n.ts.
import { _msgs } from './i18n'
const zh: Record<string, string> = {
  'b17.fx.title': 'M1Pay 币种 / 汇率', 'b17.fx.hint': 'M1Pay 只结算马币（MYR）。仅限 MYR：非 MYR 计价的套餐不显示 M1Pay，服务端也会拒绝；按汇率折算：用下面的汇率（1 单位外币 = 多少 MYR）折成 MYR 收款，四舍五入到 0.01，订单会记录原币、原金额、MYR 金额和汇率，回调按 MYR 金额核对。留空的币种不提供 M1Pay。服务器环境变量 MIRE_M1PAY_CURRENCY_MODE 若设置则优先。保存在 vs_dramas_config.mire_m1pay_fx。',
  'b17.fx.missing': '库里还没有 mire_m1pay_fx 配置行，当前按“仅限 MYR”生效；请先执行 sql/b17_migrate.sh。', 'b17.fx.effective': '当前：{m}，M1Pay 可用币种 {c}', 'b17.fx.myr_only': '仅限 MYR（默认）', 'b17.fx.convert': '按汇率折算成 MYR', 'b17.fx.rate': '1 {c} = ? MYR',
  'b9.tip.title': '打赏配置', 'b9.tip.hint': '保存在 vs_dramas_config.mire_tip。扣币（mire_coin.php mire_tip）和 H5 打赏档位（/video/tipRule）都读这一条，保存后立即生效。',
  'b9.tip.min': '每次最少', 'b9.tip.max': '每次最多', 'b9.tip.presets': 'H5 档位（逗号分隔，最多 8 个，须在上下限内）', 'b9.tip.missing': '库里还没有 mire_tip 配置行，当前按默认 1–5 生效；请先执行 sql/b9_migrate.sh。', 'b9.tip.effective': '当前生效：{min}–{max}，档位 {p}',
  'b9.cur.title': '提现币种与汇率', 'b9.cur.hint': '数据来自 vs_lang.currency / exchange_rate（FA /user_wallet_apply/rule 返回给 H5）。币种为空或汇率为 0 的语种，H5 提现会提示“币种未配置”。广告数一列用于排查 /ad/index 无广告。',
  'b9.cur.lang': '语种', 'b9.cur.currency': '币种', 'b9.cur.rate': '汇率（积分/1 单位货币）', 'b9.cur.ready': '可提现', 'b9.cur.ads': '广告数', 'b9.cur.none_ready': '还没有任何可用的提现币种，H5 提现会被拦截。',
}
const en: Record<string, string> = {
  'b17.fx.title': 'M1Pay currency / FX', 'b17.fx.hint': 'M1Pay settles in MYR only. MYR only: M1Pay is hidden for non-MYR packages and the server rejects them. Convert: the rates below (MYR per 1 unit) convert the price to MYR, rounded half-up to 0.01; the order stores original currency/amount, MYR amount and rate, and the callback is checked against the MYR amount. Currencies left empty get no M1Pay. The server env MIRE_M1PAY_CURRENCY_MODE, if set, takes precedence. Stored in vs_dramas_config.mire_m1pay_fx.',
  'b17.fx.missing': 'Row mire_m1pay_fx is missing; "MYR only" applies. Run sql/b17_migrate.sh first.', 'b17.fx.effective': 'Current: {m}; M1Pay currencies {c}', 'b17.fx.myr_only': 'MYR only (default)', 'b17.fx.convert': 'Convert to MYR by rate', 'b17.fx.rate': '1 {c} = ? MYR',
  'b9.tip.title': 'Tip rule', 'b9.tip.hint': 'Stored in vs_dramas_config.mire_tip. Both the debit (mire_coin.php mire_tip) and the H5 tip tiers (/video/tipRule) read this row; changes apply immediately.',
  'b9.tip.min': 'Min per tip', 'b9.tip.max': 'Max per tip', 'b9.tip.presets': 'H5 tiers (comma separated, up to 8, within min–max)', 'b9.tip.missing': 'Row mire_tip is missing; default 1–5 applies. Run sql/b9_migrate.sh first.', 'b9.tip.effective': 'Effective: {min}–{max}, tiers {p}',
  'b9.cur.title': 'Withdrawal currency & rate', 'b9.cur.hint': 'From vs_lang.currency / exchange_rate (returned to H5 by FA /user_wallet_apply/rule). Languages with empty currency or rate 0 make H5 withdrawals show "currency not configured". The Ads column helps diagnose /ad/index with no ads.',
  'b9.cur.lang': 'Language', 'b9.cur.currency': 'Currency', 'b9.cur.rate': 'Rate (points per 1 unit)', 'b9.cur.ready': 'Ready', 'b9.cur.ads': 'Ads', 'b9.cur.none_ready': 'No usable withdrawal currency yet; H5 withdrawals will be blocked.',
}
Object.assign(_msgs.zh, zh); Object.assign(_msgs.en, en)
export const b9zh = zh, b9en = en
