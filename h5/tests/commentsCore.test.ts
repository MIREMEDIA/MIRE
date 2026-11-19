import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as C from '../src/api/commentsCore.ts'
test('paths match FA video controller methods', () => {
  assert.deepEqual(Object.values(C.COMMENT_PATHS), ['/video/commentsList', '/video/commentReplysList', '/video/comment', '/video/delComment', '/video/likeComment', '/video/dislikeComment'])
})
test('normComment: real FA row (flat avatar/nickname, reply_count, no vid/pid) uses ctx', () => {
  const c = C.normComment({ id: 5, user_id: 7, content: 'hi', image: '', likes: 3, createtime: 1700000000, avatar: 'a.png', nickname: 'Ann', reply_count: 2, is_like: 1 }, 7, { vid: 101, pid: 0 })!
  assert.equal(c.id, 5); assert.equal(c.vid, 101); assert.equal(c.pid, 0); assert.equal(c.user.nickname, 'Ann'); assert.equal(c.user.avatar, 'a.png'); assert.equal(c.user.id, 7)
  assert.equal(c.likes, 3); assert.equal(c.likesText, '3'); assert.equal(c.liked, true); assert.equal(c.replyCount, 2); assert.equal(c.mine, true); assert.equal(c.replyTo, '')
  const r = C.normComment({ id: 6, user_id: 8, content: 'r', likes: 0, avatar: null, nickname: null, is_like: 0, createtime: 1 }, 7, { vid: 101, pid: 5 })!
  assert.equal(r.pid, 5); assert.equal(r.mine, false); assert.equal(r.user.nickname, ''); assert.equal(r.replyCount, 0)
  assert.equal(C.normComment(null), null); assert.equal(C.normComment({ content: 'no id' }), null)
})
test('"1.2K" likes: parsed for math, original string kept for display', () => {
  assert.equal(C.parseCount('1.2K'), 1200); assert.equal(C.parseCount('12K'), 12000); assert.equal(C.parseCount('999'), 999); assert.equal(C.parseCount(5), 5); assert.equal(C.parseCount('x'), 0); assert.equal(C.parseCount(null), 0)
  const c = C.normComment({ id: 1, user_id: 2, likes: '1.2K' })!; assert.equal(c.likes, 1200); assert.equal(c.likesText, '1.2K')
  const t = C.toggleLike(c); assert.equal(t.method, 'like'); assert.equal(t.next.likes, 1201); assert.equal(t.next.likesText, '1.2K')
  assert.equal(C.applyLikes(t.next, { likes: '1.3K' }).likesText, '1.3K'); assert.equal(C.applyLikes(t.next, { likes: 7 }).likes, 7); assert.equal(C.applyLikes(t.next, null).likes, 1201)
})
test('mine only from own user_id (no server flag)', () => { assert.equal(C.normComment({ id: 1, is_my: 1, user_id: 3 }, 9)!.mine, false); assert.equal(C.normComment({ id: 1, user_id: 3 }, 0)!.mine, false) })
test('normPage: plain array, no total; hasMore = full page', () => {
  const p = C.normPage([{ id: 1 }, { id: 2 }], 1, 2, 0, { vid: 9 }); assert.equal(p.hasMore, true); assert.equal(p.total, -1); assert.equal(p.items[0].vid, 9)
  assert.equal(C.normPage([{ id: 1 }], 2, 2).hasMore, false); assert.equal(C.normPage([], 1, 2).hasMore, false)
  assert.deepEqual(C.normPage({ total: 5, data: [{ id: 1 }] }, 1, 20).items, []); assert.deepEqual(C.normPage(null, 1, 20).items, [])
})
test('isOk / needsLogin / isServerError', () => { assert.ok(C.isOk({ code: 1 })); assert.ok(!C.isOk({ code: 0 })); assert.ok(!C.isOk(null)); assert.ok(C.needsLogin({ code: 401 })); assert.ok(C.isServerError({ code: 500 })); assert.ok(!C.isOk({ code: 500 })) })
test('validateContent: trim, empty refused, <= 500 (< varchar 512)', () => { assert.ok(C.MAX_LEN <= 512); assert.equal(C.validateContent('  '), 'empty'); assert.equal(C.validateContent('x'.repeat(501)), 'long'); assert.equal(C.validateContent('ok'), ''); assert.equal(C.validateContent('😀'.repeat(500)), '') })
test('request params/bodies match FA', () => {
  assert.deepEqual(C.listParams(3, 2, 20, 'hot'), { vid: 3, page: 2, pagesize: 20, sort: 'hot' })
  assert.deepEqual(C.listParams(3, 1, 20, 'time'), { vid: 3, page: 1, pagesize: 20, sort: 'time' })
  assert.deepEqual(C.replyParams(9, 1), { pid: 9, page: 1, pagesize: 5 })
  assert.deepEqual(C.postBody(3, ' hi '), { vid: 3, pid: 0, content: 'hi', image: '' })
  assert.deepEqual(C.postBody(3, 'r', 5), { vid: 3, pid: 5, content: 'r', image: '' })
  assert.deepEqual(C.delBody(4), { id: 4 }); assert.deepEqual(C.likeBody(4), { cid: 4 })
})
test('post/delete return {comments} total (maybe "K"); local optimistic row', () => {
  assert.deepEqual(C.respCount({ comments: 12 }, 'comments'), { n: 12, text: '12' }); assert.deepEqual(C.respCount({ comments: '1.2K' }, 'comments'), { n: 1200, text: '1.2K' })
  assert.equal(C.respCount(null, 'comments'), null); assert.equal(C.respCount({}, 'comments'), null)
  const l = C.localComment(101, 0, ' hey ', { id: 7, nickname: 'Ann', avatar: '' }); assert.ok(l.id < 0); assert.equal(l.mine, true); assert.equal(l.content, 'hey'); assert.equal(l.vid, 101)
})
test('relTime buckets', () => {
  const n = 1_800_000_000
  assert.equal(C.relTime(n - 10, n).key, 'now'); assert.deepEqual(C.relTime(n - 600, n), { key: 'minute', n: 10 }); assert.equal(C.relTime(n - 7200, n).key, 'hour')
  assert.equal(C.relTime(n - 90000, n).key, 'yesterday'); assert.match(C.relTime(n - 10 * 86400, n).date!, /^\d{4}-\d\d-\d\d$/); assert.equal(C.relTime(0).key, ''); assert.equal(C.toTs(1700000000000), 1700000000)
})
test('merge/remove', () => {
  const a = [1, 2].map(id => C.normComment({ id, replys: id === 1 ? [{ id: 10, pid: 1 }] : [] })!)
  assert.equal(C.mergeItems(a, [C.normComment({ id: 2 })!, C.normComment({ id: 3 })!]).length, 3)
  const r = C.removeItem(a, 10); assert.equal(r[0].replies.length, 0); assert.equal(r[0].replyCount, 0); assert.equal(C.removeItem(a, 2).length, 1)
})
test('dirOf', () => { assert.equal(C.dirOf('ar'), 'rtl'); assert.equal(C.dirOf('ar-SA'), 'rtl'); assert.equal(C.dirOf('en'), 'ltr'); assert.equal(C.dirOf('zh-TW'), 'ltr') })
