import { isStagingId, libDetail } from './staging'
import { request, PRICE_LANG } from './http'
export interface Drama { id: number; title: string; subtitle?: string; image: string; image_h?: string; description?: string; episodes: number; hots?: string; views?: string; likes?: string; favorites?: string; shares?: string; category_text_arr?: string[]; episodes_list?: Episode[] }
export interface Episode { id: number; vid: number; name: string; image: string; duration: number; price: number; vprice: number; url: string | null; likes?: string; views?: string; video?: Drama }
// ---- GET (read only) ----
export const getInit = () => request('/index/init')
export const getLangList = () => request('/index/lang_list')
export const getBanners = () => request<any[]>('/block/index')
export const getHome = () => request<{ must: Drama[]; news: Drama[]; top: Drama[] }>('/index/home')
export const getCategories = () => request<any[]>('/category/index')
export const getList = (p: { page?: number; pagesize?: number; category_id?: number | string; search?: string; type?: 'recommend' | 'top' }) => request<Drama[]>('/video/index', { params: p })
// staging library ids look like 's12' and are served by the companion API, never the live backend
export const getDetail = (id: number | string) => (isStagingId(id) ? libDetail(String(id)) : request<Drama>('/video/detail', { params: { id } }))
export const getRecommend = (page = 1) => request<Episode[]>('/video/recommend', { params: { page } })
// tasks (vs_dramas_task) + share/ad activity, and backend notifications (announcements). Read-only GETs.
export const getJobs = () => request<{ tasks: any[]; activity?: Record<string, { status: string; limit: string; usable: string }> }>('/job/index')
export const getNotifications = () => request<any[]>('/index/notification')
export const getRichtext = (id: number | string) => request('/index/richtext', { params: { id } })
export const getVipList = () => request<{ list: any[] }>('/vip/index', { lang: PRICE_LANG })
export const getCoinList = () => request<{ list: any[] }>('/usable/index', { lang: PRICE_LANG })
// GET but require Token
export const getUserInfo = () => request('/user/index')
export const getWatchList = (page = 1) => request('/video/logList', { params: { page } })
export const getFavoriteList = (page = 1) => request('/video/favoriteList', { params: { page } })
export const getWalletLog = (page = 1) => request('/user_wallet_log/index', { params: { page } })
export const getSignList = () => request('/user_sign/index')
// ---- WRITE endpoints (unchanged existing backend). Only fired by explicit user action when signed in. ----
export const unlockEpisode = (vid: number, episode_id: number) => request('/video/getEpisodesUrl', { method: 'POST', body: { vid, episode_id } })
export const addWatchLog = (b: any) => request('/video/log', { method: 'POST', body: b })
export const toggleFavorite = (b: any) => request('/video/favorite', { method: 'POST', body: b })
export const toggleLike = (b: any) => request('/video/like', { method: 'POST', body: b })
// live signin is a GET that writes; when the companion API is configured the H5 uses its POST + Idempotency-Key instead
export const signIn = () => request('/user_sign/signin')
export const sendCode = (b: any) => request('/sms/send', { method: 'POST', body: b })
export const codeLogin = (b: any) => request('/user/captchaLogin', { method: 'POST', body: b })
export const accountLogin = (b: any) => request('/user/accountLogin', { method: 'POST', body: b })
export const thirdH5 = (p: any) => request('/user/thirdAuthorize', { params: p })
// ---- Row 22 comments (FA /addons/dramas/video/*) — shapes normalised in commentsCore.ts ----
import { COMMENT_PATHS as CP, listParams, replyParams, postBody, delBody, likeBody, type Sort } from './commentsCore'
export const getComments = (vid: number, page = 1, pageSize = 20, sort: Sort = 'hot') => request(CP.list, { params: listParams(vid, page, pageSize, sort) })
export const getCommentReplies = (pid: number, page = 1, pageSize = 5) => request(CP.replies, { params: replyParams(pid, page, pageSize) })
export const postComment = (vid: number, content: string, pid = 0) => request(CP.post, { method: 'POST', body: postBody(vid, content, pid) })
export const delComment = (id: number) => request(CP.del, { method: 'POST', body: delBody(id) })
export const likeComment = (id: number) => request(CP.like, { method: 'POST', body: likeBody(id) })
export const dislikeComment = (id: number) => request(CP.dislike, { method: 'POST', body: likeBody(id) })
