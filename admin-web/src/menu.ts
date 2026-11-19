import raw from './menu.json'
export interface PageSpec { perm?: string; g: string; s: string | null; id: string; t: string; old?: string; st?: string; k?: string; cols?: any[]; fields?: any[]; filters?: any[]; note?: string; tabs?: any[] }
export const pages: PageSpec[] = raw as any
// Pages backed by the real read-only API (page id -> resource key in api/schema.php)
export const live: Record<string, string> = {members: 'users', drama: 'dramas', episodes: 'episodes', categories: 'categories', rewards: 'rewards', comments: 'comments', playlists: 'playlists', blocks: 'blocks', notices: 'notices', agreements: 'agreements', wallet: 'wallet', withdraw: 'withdraw', o_vip: 'vip_orders', o_pts: 'points_orders', o_drama: 'unlock_orders', o_res: 'reseller_orders', o_novel: 'novel_orders', price: 'vip_packages', pkg_pts: 'points_packages', pkg_res: 'reseller_packages', res_log: 'reseller_log', signin: 'signin', tasks: 'tasks', task_log: 'task_log', cards: 'cards', cp_owner: 'cp_owner', cp_log: 'cp_log', cp_wd: 'cp_wd', pitchers: 'pitchers', admins: 'admins', ads: 'ads', ad_log: 'ad_log', versions: 'versions', novels: 'novels', novel_cats: 'novel_cats', writers: 'writers', novel_rewards: 'novel_rewards'}
export const groupIcon: Record<string, string> = { 工作台: '◆', 数据中心: '▤', 内容: '▶', '创作中心 Creator Center': '✎', 用户: '☺', 交易与支付: '¥', 营销增长: '✦', 投放归因: '◎', 多语言: '文', 系统与安全: '⚙' }
export function findPage(id: string) { return pages.find(p => p.id === id) }
// B1 editors (page id -> b1 res) and hidden menus (row 33: 新 H5 不做小说; B4 row 15: 积分商城暂不上线)
export const b1: Record<string, string> = { site: 'site', switches: 'switches', langs: 'langs', groups: 'groups', versions: 'versions', sms: 'integrations', smtp: 'integrations', oss: 'integrations' }
export const hidden = new Set(['novels', 'novel_cats', 'novel_rewards', 'o_novel', 'writers', 'mall_goods', 'mall_orders'])
// B4a editors (page id -> b4 res)：row 22 评论审核/置顶/软删除
export const b4: Record<string, string> = { comments: 'comments', rewards: 'coin' }   // B8：tasks/signin 移到 b8   // B4c: 打赏/奖励/调账记录、任务配置、签到
// P2 标注（feature_matrix #112）：没有新 H5 生效点的模块，菜单加“新 H5 未接入”标签。
// 评论(comments) 已于 B2 部分B 在新 H5 接入（第 22 项），已移除；打赏(rewards) 在 B4 接入后从此表移除。
export const notOnH5 = new Set(['res_log', 'cards', 'pkg_res', 'o_res', 'rewards'])
export const NOT_ON_H5 = '新 H5 未接入'
// B8 页面（page id -> B8 mode）
export const b8: Record<string, string> = { pay_stripe: 'pay', pay_m1pay: 'pay', pay_paypal: 'pay', pay_apple: 'pay', pay_antom: 'pay', pay_waffo: 'pay', pay_airwallex: 'pay', tasks: 'tasks', signin: 'signin', share: 'share', withdraw: 'withdraw', wd_cfg: 'wd_rule', ads: 'ads', video_log: 'video_log', sms_log: 'sms_log' }
// B9 页面（page id -> B9 mode）：打赏配置 / 提现币种与汇率
export const b9: Record<string, string> = { tip_cfg: 'tip', wd_currency: 'currency' }
// B10 短剧模块 CRUD（page id -> b10 res）：替换只读列表 / Preview“即将上线”。写操作的权限节点见 api/adm_perm.php
export const b10: Record<string, string> = { drama: 'drama', episodes: 'episode', members: 'member', price: 'vip_pkg', pkg_pts: 'pts_pkg', p_vip: 'p_vip', p_pts: 'p_pts', o_vip: 'o_vip', o_pts: 'o_pts', wallet: 'wallet' }
export const b10Perm: Record<string, string> = { drama: 'adm.content', episode: 'adm.content', member: 'adm.member', vip_pkg: 'adm.package', pts_pkg: 'adm.package', p_vip: 'adm.pitcher', p_pts: 'adm.pitcher', o_vip: 'adm.order', o_pts: 'adm.order', wallet: 'adm.wallet' }

// B18：权限管理三页（FastAdmin auth 表：角色组 / 菜单规则 / 管理员），优先于 live 列表
export const b18: Record<string, string> = { roles: 'groups', rules: 'rules', admins: 'admins' }

// FE-M5（CTO 定案）：7 个 FA 插件/配置占位页从菜单去掉，路由重定向（ad_cloud → 云存储 OSS，其余 → 首页）
export const redirects: Record<string, string> = { attach: '/p/dash', addons: '/p/dash', ad_cmd: '/p/dash', ad_drama: '/p/dash', ad_pay: '/p/dash', ad_editor: '/p/dash', ad_cloud: '/p/oss' }
// FE-M5：菜单隐藏但路由保留（an_* 统计页待排期；profile 入口移到右上角头像菜单）
export const menuHidden = new Set(['an_user', 'an_drama', 'an_mkt', 'an_pts', 'an_fund', 'an_ig', 'profile'])
// FE-M5：所有已登录管理员都可访问（不受 FA 角色组页面授权限制）
export const selfPages = new Set(['profile'])
