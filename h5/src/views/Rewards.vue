<template><section class="scr">
  <div class="body">
    <NoticeBar />
    <div class="rhero"><div class="top0"><h1>{{ $t('rewards.title') }}</h1></div>
      <h2>{{ $t('rewards.hero') }}</h2><div class="rbal"><span>{{ $t('wallet.balance') }}</span><template v-if="user.token"><b>🪙 {{ user.info?.usable ?? '…' }}</b><router-link to="/wallet" class="pillw">{{ $t('me.topup') }} ›</router-link></template>
        <template v-else><b class="guestbal">—</b><router-link to="/login" class="pillw">{{ $t('common.signin') }} ›</router-link></template></div>
      <div class="coins3">🪙</div></div>
    <div class="card2"><div class="ch2"><b>{{ $t('rewards.checkin') }}</b><small v-if="user.token && signLoaded">{{ $t('b7.sign.streak', { n: streak }) }}</small><small v-else>{{ $t('rewards.checkinDesc') }}</small></div>
      <p v-if="!user.token" class="tasknote">{{ $t('b7.sign.guest') }}</p>
      <p v-else-if="!signLoaded" class="tasknote">{{ $t('common.loading') }}</p>
      <p v-else-if="!days.length" class="tasknote">{{ signErr || $t('common.empty') }}</p>
      <div v-else class="days2"><div v-for="(d, i) in days" :key="d.date || i" :class="{ d: !!d.is_sign, today: i === todayIdx && !d.is_sign }"><small>{{ i === todayIdx ? $t('rewards.today') : (d.date || '').slice(5) }}</small><span class="cc">🪙</span><b>+{{ d.score }}</b></div></div>
      <button class="btn big" :disabled="checking || doneToday || (!!user.token && todayIdx < 0)" @click="check">{{ doneToday ? '✓ ' + $t('rewards.btn') : $t('rewards.btn') + (todayScore ? ' +' + todayScore + ' 🪙' : '') }}</button></div>
    <div class="card2"><div class="ch2"><b>{{ $t('rewards.tasks') }}</b></div>
      <p v-if="tasksLoading" class="tasknote">{{ $t('common.loading') }}</p>
      <p v-else-if="tasksErr" class="tasknote">{{ tasksErr }} <a class="lnk" @click="loadTasks">{{ $t('b7.retry') }}</a></p>
      <p v-else-if="!tasks.length" class="tasknote">{{ $t('common.empty') }}</p>
      <div v-for="tk in tasks" :key="tk.id" class="task"><span class="ti"><Icon :name="tk.icon" :size="20" /></span><div class="m"><b>{{ $st(tk.title) || $t('b7.task.' + tk.event) }}</b><p>+{{ tk.usable }} 🪙<span v-if="tk.limit > 1" class="lim"> ×{{ tk.limit }}/{{ $t('rewards.today') }}</span></p><p v-if="tk.desc" class="desc">{{ tk.desc }}</p></div>
        <button class="gob" :disabled="tk.status === 1 || tk.status === 3" @click="go(tk)">{{ $t('b7.task.st' + tk.status) }}</button></div></div>
  </div><ShareSheet ref="sh" /><AdSheet ref="ad" @done="refresh" /></section></template>
<script setup lang="ts">
// B7 #3: nothing hardcoded — check-in = FA /user_sign/index (month calendar, 7-day window via signWindow) + /user_sign/signin;
// tasks = FA /job/index tasks (by event) + activity.share/ad. Share Go -> invite share sheet, Ad Go -> AdSheet(type=usable).
// The staging companion check-in is only used when MIRE_CONFIG.companionCheckin === true.
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUser } from '../stores/user'
import { getUserInfo } from '../api'
import { getSign, doSignin, getJobs } from '../api/b7'
import { signWindow, flattenJobs, activityTasks, buildShareUrl, type Task, type SignDay } from '../api/b7Core'
import NoticeBar from '../components/NoticeBar.vue'
import ShareSheet from '../components/ShareSheet.vue'
import AdSheet from '../components/AdSheet.vue'
import { COMPANION, checkinStatus, checkinPost } from '../api/staging'
import { toast } from '../components/toast'
import Icon from '../components/Icon.vue'
const user = useUser(); const router = useRouter(); const { t } = useI18n()
const USE_COMP = !!COMPANION && (window as any).MIRE_CONFIG?.companionCheckin === true
const checking = ref(false); const doneToday = ref(false); const days = ref<SignDay[]>([]); const todayIdx = ref(-1); const streak = ref(0); const signLoaded = ref(false); const signErr = ref('')
const todayScore = computed(() => (todayIdx.value >= 0 ? days.value[todayIdx.value]?.score : 0) || 0)
const tasks = ref<Task[]>([]); const tasksLoading = ref(true); const tasksErr = ref('')
const sh = ref<InstanceType<typeof ShareSheet>>(); const ad = ref<InstanceType<typeof AdSheet>>()
async function loadTasks() {
  tasksLoading.value = true; tasksErr.value = ''
  try { const r = await getJobs(); if (r?.code !== 1 || !r.data) throw new Error(r?.msg || t('b7.fail')); tasks.value = [...flattenJobs(r.data), ...activityTasks(r.data.activity)] }
  catch (e: any) { tasks.value = []; tasksErr.value = e.message || t('b7.fail') } finally { tasksLoading.value = false }
}
async function loadSign() {
  if (!user.token) return
  if (USE_COMP) { const r = await checkinStatus(); signLoaded.value = true; if (r.code === 1 && r.data) { days.value = (r.data.days || []).map((x: any, i: number) => ({ date: '', day: i + 1, score: Number(x.score ?? x.usable ?? x.n ?? 0), is_sign: x.is_sign ?? x.done ? 1 : 0, current: 'after' })); doneToday.value = !!r.data.today_done; const nx = days.value.findIndex(d => !d.is_sign); todayIdx.value = doneToday.value ? Math.max(0, (nx < 0 ? 7 : nx) - 1) : Math.max(0, nx) } return }
  const r = await getSign(); signLoaded.value = true
  if (r.code !== 1) { signErr.value = r.msg || t('b7.fail'); return }
  const w = signWindow(r.data?.days || [], Number(r.data?.continue_days || 0)); days.value = w.list; todayIdx.value = w.todayIdx; doneToday.value = w.doneToday; streak.value = Number(r.data?.continue_days || 0)
}
async function refresh() { const u = await getUserInfo(); if (u.code === 1) user.info = u.data; loadTasks() }
onMounted(() => { loadTasks(); loadSign(); if (user.token && !user.info) getUserInfo().then(r => { if (r.code === 1) user.info = r.data }) })
async function go(tk: Task) {
  if (!user.token && tk.action !== 'route') { router.push('/login'); return }
  if (tk.action === 'share') { const uid = user.info?.id || ''; await sh.value?.share(buildShareUrl(location, { uid, page: 'home', linkSign: localStorage.getItem('mire_link_sign') || '' }), t('b7.invite.shareText')); return }
  if (tk.action === 'ad') { ad.value?.start('usable'); return }
  if (tk.action === 'route' && tk.to) { router.push(tk.to); return }
  if (tk.action === 'proof') { toast(t('b7.task.proof')); return }
  toast(t('home.soon'))
}
async function check() {
  if (!user.token) { toast(t('rewards.loginFirst')); router.push('/login'); return }
  if (checking.value || doneToday.value) return
  checking.value = true
  try {
    if (USE_COMP) { const r = await checkinPost(); toast(r.msg || t('b7.ok')); await loadSign() }
    else { const r = await doSignin(); toast(r.msg || (r.code === 1 ? t('b7.ok') : t('b7.fail'))); if (r.code === 1) { await loadSign(); refresh() } }
  } finally { checking.value = false }
}
</script>
