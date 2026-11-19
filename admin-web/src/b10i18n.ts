// B10 page copy (zh / en). Same mechanism as b8i18n.ts / b9i18n.ts.
import { _msgs } from './i18n'
const zh: Record<string, string> = {
  'b10.kw': '关键词 / ID', 'b10.total': '共 {n} 条', 'b10.add': '新增', 'b10.edit': '编辑', 'b10.del': '删除', 'b10.save': '保存', 'b10.cancel': '取消', 'b10.op': '操作', 'b10.saved': '已保存', 'b10.deleted': '已删除',
  'b10.confirm_del': '确认删除 #{id}？', 'b10.noperm': '当前账号（角色：{r}）没有「{p}」权限：只能查看，新增/编辑/删除/退款/调账都会被服务端拒绝（403）。', 'b10.forbidden': '无权限（403）：{m}',
  'b10.readonly': '当前账号没有编辑权限', 'b10.refund.no': '该订单不可退款', 'b10.missing': '表 {t} 不存在，请先执行迁移。', 'b10.h5': '保存后 H5 立即读取新数据（FA 接口直接查这张表）。',
  'b10.refund': '退款', 'b10.refunded': '已退款', 'b10.refund.title': '模拟退款 #{id}', 'b10.refund.reason': '退款原因（必填，≤200 字）', 'b10.refund.hint': '只做后台记录 + 回收权益，不调用任何支付渠道；同一订单重复提交返回原退款记录（幂等）。', 'b10.refund.replay': '该订单已退款（幂等返回）', 'b10.refund.notable': '缺 vs_mire_refund 表，退款按钮不可用：先执行 sql/b10_migrate.sh。',
  'b10.remark': '备注', 'b10.adjust': '调账', 'b10.adjust.title': '调账：用户 #{id}', 'b10.adjust.type': '钱包', 'b10.adjust.delta': '变动（负数为扣减）', 'b10.adjust.reason': '原因（必填）', 'b10.adjust.max': '单笔上限 {m}；扣减后余额不能为负；同一表单重复提交只记一次。', 'b10.adjust.ok': '调账成功：{b} → {a}', 'b10.adjust.replay': '重复提交，未重复记账',
  'b10.wallet_log': '最近钱包流水', 'b10.sms.src': '类型', 'b10.sms.all': '短信 + 邮件', 'b10.sms.used': '已使用',
  'b10.job.titles': '标题（每个语种）', 'b10.job.raw': '旧数据（纯文本）：{s}，保存后转为按语种存储', 'b10.job.hint': 'H5“新人/每日任务”读取的是 vs_dramas_job（本页“任务”标签）；按 H5 当前语种取对应标题。',
  'b10.rsa.in_use': '当前在用公钥（由服务器私钥文件推导）：', 'b10.rsa.mismatch': '与库里旧公钥不一致', 'b10.rsa.show_pub': '查看公钥', 'b10.rsa.legacy': '下面的输入框只是旧版配置备份，已改为只读；更换密钥请按 README_B10 的轮换脚本操作，留空保存不会清空。',
  'b16.low.inline': '{f} {c} {v} 低于 Stripe 最低金额 {c} {m}：Stripe 渠道会拒绝付款（H5 会提示用户）。可以保存，但需确认。', 'b16.low.title': '价格低于 Stripe 最低金额', 'b16.low.body': '以下价格低于 Stripe 最低扣款金额，用户选 Stripe（卡）支付时会失败。价格不会被自动修改。仍要保存吗？', 'b16.low.ok': '仍然保存', 'b16.low.hint': '阈值：env MIRE_STRIPE_MIN_AMOUNT_<币种> 或 priv/db.php stripe_min；MYR 结算账户需折合 ≥ RM2，USD 建议 0.50–0.60。',
}
const en: Record<string, string> = {
  'b10.kw': 'Keyword / ID', 'b10.total': '{n} rows', 'b10.add': 'Add', 'b10.edit': 'Edit', 'b10.del': 'Delete', 'b10.save': 'Save', 'b10.cancel': 'Cancel', 'b10.op': 'Actions', 'b10.saved': 'Saved', 'b10.deleted': 'Deleted',
  'b10.confirm_del': 'Delete #{id}?', 'b10.noperm': 'This account (role: {r}) lacks permission "{p}": view only. Create/edit/delete/refund/adjust are rejected by the server (403).', 'b10.forbidden': 'Forbidden (403): {m}',
  'b10.readonly': 'No edit permission for this account', 'b10.refund.no': 'This order cannot be refunded', 'b10.missing': 'Table {t} is missing; run the migration first.', 'b10.h5': 'H5 reads the new data right after saving (FA queries this table directly).',
  'b10.refund': 'Refund', 'b10.refunded': 'Refunded', 'b10.refund.title': 'Simulated refund #{id}', 'b10.refund.reason': 'Reason (required, ≤200)', 'b10.refund.hint': 'Records the refund and revokes benefits only; no payment channel is called. Resubmitting returns the same refund (idempotent).', 'b10.refund.replay': 'Already refunded (idempotent)', 'b10.refund.notable': 'Table vs_mire_refund is missing; run sql/b10_migrate.sh first.',
  'b10.remark': 'Remark', 'b10.adjust': 'Adjust', 'b10.adjust.title': 'Adjust user #{id}', 'b10.adjust.type': 'Wallet', 'b10.adjust.delta': 'Delta (negative = deduct)', 'b10.adjust.reason': 'Reason (required)', 'b10.adjust.max': 'Max {m} per adjustment; balance cannot go negative; resubmitting the same form counts once.', 'b10.adjust.ok': 'Adjusted: {b} → {a}', 'b10.adjust.replay': 'Duplicate submit, not applied again',
  'b10.wallet_log': 'Recent wallet log', 'b10.sms.src': 'Type', 'b10.sms.all': 'SMS + email', 'b10.sms.used': 'Used',
  'b10.job.titles': 'Title (per language)', 'b10.job.raw': 'Legacy plain text: {s}; saved per language from now on', 'b10.job.hint': 'H5 new-user/daily tasks read vs_dramas_job (this tab), using the title for the current H5 language.',
  'b10.rsa.in_use': 'Public key in use (derived from the server key file):', 'b10.rsa.mismatch': 'Differs from legacy DB key', 'b10.rsa.show_pub': 'Show public key', 'b10.rsa.legacy': 'The box below is a read-only legacy backup. To change keys follow the rotation script in README_B10; saving empty never clears it.',
  'b16.low.inline': '{f} {c} {v} is below the Stripe minimum {c} {m}: Stripe will reject the payment (H5 shows an error). You can still save after confirming.', 'b16.low.title': 'Price below Stripe minimum', 'b16.low.body': 'These prices are below the Stripe minimum charge, so card (Stripe) payments will fail. Prices are NOT changed automatically. Save anyway?', 'b16.low.ok': 'Save anyway', 'b16.low.hint': 'Threshold: env MIRE_STRIPE_MIN_AMOUNT_<CUR> or priv/db.php stripe_min; MYR-settled accounts need ≥ RM2, suggest USD 0.50–0.60.',
}
Object.assign(_msgs.zh, zh); Object.assign(_msgs.en, en)
