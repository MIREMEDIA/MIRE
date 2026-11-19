// FE-M1 A-G1: 简体中文字段名（列表/表单/卡片标题）。原始键名保留在 title 属性或小字里，方便对照数据库。
// 只做显示映射，不改提交的数据和接口。未收录的键原样显示。
export const FIELD_LABEL: Record<string, string> = {
  id: 'ID', order_sn: '订单号', user: '用户', user_id: '用户 ID', pkg: '套餐', package_title: '套餐', amount: '金额', pay_fee: '实付金额', total_fee: '订单金额',
  status: '状态', createtime: '创建时间', updatetime: '更新时间', paytime: '支付时间', pay_type: '支付方式', platform: '平台', remark: '备注',
  username: '用户名', nickname: '昵称', email: '邮箱', mobile: '手机号', usable: '金币', money: '余额', score: '积分', avatar: '头像',
  wallet_type: '钱包类型', type: '类型', wallet: '变动', before: '变动前', after: '变动后', oper_type: '操作类型', memo: '说明',
  name: '名称', title: '标题', rules: '权限节点', pid: '上级', weigh: '排序', image: '图片', lang: '语种代码', lang_id: '语种', lang_cn: '中文名称',
  nation_code: '国家区号', exchange_rate: '汇率', country_code: '国家代码', currency: '币种', version: '版本号', newversion: '新版本号', oldversion: '旧版本号',
  packagesize: '安装包大小', content: '内容', downloadurl: '下载地址', enforce: '强制更新', price: '价格', first_price: '首购价', original_price: '原价', days: '天数',
  public_key: '公钥', private_key: '私钥', webhook_key: 'Webhook 密钥', app_id: 'App ID', secret: '密钥', mch_id: '商户号', client_id: 'Client ID', client_secret: 'Client Secret',
  mail_type: '邮件发送方式', mail_smtp_host: 'SMTP 服务器', mail_smtp_port: 'SMTP 端口', mail_smtp_user: 'SMTP 账号', mail_smtp_pass: 'SMTP 密码', mail_verify_type: 'SMTP 加密方式', mail_from: '发件人地址',
  upload_type: '上传方式', uploadurl: '上传地址', cdnurl: 'CDN 地址', bucket: '存储桶', region: '区域', endpoint: '节点', accesskey: 'AccessKey', secretkey: 'SecretKey',
  block_switch: '屏蔽开关', novel_switch: '小说模块开关', mobile_switch: '手机号登录开关', single_switch: '单集购买开关', ad_switch: '广告开关', sign_switch: '签到开关',
  bind_phone: '绑定手机', bind_email: '绑定邮箱', user_register: '注册账号', user_recharge: '充值任意金额', watch_videos: '观看短剧', custom_event: '自定义任务', share: '邀请好友', share_success: '邀请成功', ad: '看广告',
}
const SECRET = /(secret|private|password|pass|token|webhook_key|secretkey|accesskey)$/i
export const isSecret = (k: string) => SECRET.test(k)
const hasCjk = (s: string) => /[\u4e00-\u9fff]/.test(s)
/** label for a raw key; prefers a server-provided Chinese title, then the table above, then the key itself */
export function fl(key: string, given?: string): string { const g = String(given ?? ''); if (g && g !== key && hasCjk(g)) return g; return FIELD_LABEL[key] ?? (g || key) }
/** mask a secret-looking value for display (keeps last 4 chars) */
export function maskVal(key: string, v: any): string { const s = String(v ?? ''); if (!s || !SECRET.test(key)) return s; return s.length <= 4 ? '••••' : '••••••' + s.slice(-4) }
/** mask a real name / nickname for display: 张三 -> 张*, Alice -> A***e */
export function maskName(v: any): string { const s = String(v ?? '').trim(); if (!s) return ''; const a = [...s]; if (a.length === 1) return a[0] + '*'; if (a.length === 2) return a[0] + '*'; return a[0] + '*'.repeat(Math.min(a.length - 2, 3)) + a[a.length - 1] }
/** order status text (vs_*_order.status: 0 待支付 / 1 已支付 / 2 已关闭；-1 / 3 等未知值原样显示) */
export const ORDER_STATUS: Record<string, string> = { '0': '待支付', '1': '已支付', '2': '已关闭', '-1': '已取消' }
