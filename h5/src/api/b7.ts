// B7 endpoints — all are the ORIGINAL FA addons/dramas controllers (fa_b4c), same params as the uni-app front end.
import { request, PRICE_LANG } from './http'
// #1 coin unlock (VideoOrder::add) — type=episode buys one episode; FA also auto-buys inside getEpisodesUrl
export const videoOrderAdd = (vid: number, episode_id: number, type: 'episode' | 'video' = 'episode') => request('/video_order/add', { method: 'POST', body: { vid, episode_id, type, platform: 'H5' } })
// #1/#3 ads (Ad.php): type usable = coin reward, unlock = unlock an episode; add/commit bodies are RSA-encrypted (rsa.ts)
import { tipReqId } from './b10Core'
export const getAd = (type: 'usable' | 'unlock', vid = 0, episode_id = 0) => request('/ad/index', { params: type === 'unlock' && vid ? { type, vid, episode_id } : { type } })  // B10 #6: unlock is order-checked before the ad plays
export const adAdd = (data: string) => request('/ad/add', { method: 'POST', body: { data } })
export const adCommit = (data: string) => request('/ad/commit', { method: 'POST', body: { data } })
// #3 check-in & tasks
export const getSign = (month?: string) => request('/user_sign/index', { params: { month } })
export const doSignin = () => request('/user_sign/signin')
export const getJobs = () => request('/job/index')
export const submitJob = (job_id: number | string, images: string, user_remark: string) => request('/job/submit', { method: 'POST', body: { job_id, images, user_remark } })
// #4/#5 share & invite
export const shareVideo = (vid: number, episode_id = 0) => request('/video/share', { method: 'POST', body: { vid, episode_id } })
export const getInvites = (page = 1, per_page = 20) => request('/share/index', { params: { type: 'all', page, per_page } })
// #6 favourites / history
export const favAdd = (vid: number, episode_id = 0) => request('/video/favorite', { method: 'POST', body: { vid, episode_id } })
export const favDel = (vid: number | string) => request('/video/delLog', { method: 'POST', body: { ids: String(vid), type: 'favorite' } })
export const logAdd = (vid: number, episode_id: number, view_time = 0) => request('/video/log', { method: 'POST', body: { vid, episode_id, view_time } })
export const logList = (page = 1, pagesize = 50) => request('/video/logList', { params: { page, pagesize } })
export const favList = (page = 1, pagesize = 50) => request('/video/favoriteList', { params: { page, pagesize } })
// #7 password
export const sendSms = (account: string, event: 'resetpwd' | 'mobilelogin' | 'register' | 'changepwd') => request('/sms/send', { method: 'POST', body: { account, nation_code: '', event } })
export const resetPwd = (account: string, password: string, captcha: string) => request('/user/resetpwd', { method: 'POST', body: { account, password, captcha, nation_code: '' } })
export const changePwd = (oldpassword: string, newpassword: string) => request('/user/changePwd', { method: 'POST', body: { oldpassword, newpassword } })
// B9 #2: FA User::setPwd — first password (code-registered, no old one) or change with an emailed/SMS code (event changepwd)
export const setPwd = (newpassword: string, captcha = '') => request('/user/setPwd', { method: 'POST', body: { newpassword, captcha } })
// #8 coin flow & tip
export const walletLog = (wallet_type: 'usable' | 'money' | 'score', page = 1, status = 'all', pagesize = 20) => request('/user_wallet_log/index', { params: { wallet_type, status, page, pagesize } })
// B9 #1: FA Video::tipRule {min,max,presets} (admin 打赏配置)
export const getTipRule = () => request('/video/tipRule')
// B10 二批#7: one request_id per tap — FA dedupes by it and now REJECTS a replay (no debit => never success)
export const tipVideo = (video_id: number, num: number, request_id: string = tipReqId()) => request('/video/reward', { method: 'POST', body: { video_id, num, request_id } })
// #9 withdraw
export const withdrawRule = () => request('/user_wallet_apply/rule')
export const withdrawApply = (b: { type: string; money: number; currency: string }) => request('/user_wallet_apply/apply', { method: 'POST', body: { ...b, platform: 'H5' } })
export const withdrawLog = (page = 1) => request('/user_wallet_apply/index', { params: { page } })
export const bankInfo = (type: string) => request('/user_bank/info', { params: { type } })
export const bankEdit = (b: Record<string, any>) => request('/user_bank/edit', { method: 'POST', body: b })
// #2 orders
export const coinOrders = (page = 1) => request('/usable/order_list', { params: { page, include_unpaid: 1 }, lang: PRICE_LANG })
export const vipOrders = (page = 1) => request('/vip_order/index', { params: { page, include_unpaid: 1 }, lang: PRICE_LANG })
export const coinOrderDetail = (order_sn: string) => request('/usable/order_detail', { params: { order_sn }, lang: PRICE_LANG })
export const vipOrderDetail = (order_sn: string) => request('/vip_order/detail', { params: { order_sn }, lang: PRICE_LANG })
