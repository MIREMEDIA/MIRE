<template><section class="scr">
  <div class="top"><span class="ic2" @click="$router.back()"><Icon name="back" /></span><h1>{{ $t('b7.settings.title') }}</h1></div>
  <div class="body" style="padding:0 16px 40px">
    <p v-if="!user.token" class="note">{{ $t('b7.loginFirst') }} <router-link to="/login" class="lnk">{{ $t('common.signin') }} ›</router-link></p>
    <template v-else>
      <div class="list2"><div><Icon name="user" :size="20" /><span>ID</span><em>{{ user.info?.id }}</em></div><div><Icon name="doc" :size="20" /><span>{{ $t('login.email') }}</span><em>{{ user.info?.email || user.info?.mobile || '—' }}</em></div></div>
      <p class="secT" data-b9="pwd-mode">{{ !hasPwd ? $t('b7.settings.set') : $t('b7.settings.change') }}</p>
      <p v-if="!hasPwd" class="note" data-b9="pwd-first">{{ $t('b9.pwd.first') }}</p>
      <div v-else class="seg2" data-b9="pwd-way"><span :class="{ on: way === 'old' }" @click="way = 'old'">{{ $t('b9.pwd.byOld') }}</span><span :class="{ on: way === 'code' }" data-b9="pwd-way-code" @click="way = 'code'">{{ $t('b9.pwd.byCode') }}</span></div>
      <div class="field" v-if="hasPwd && way === 'old'"><input v-model="oldp" type="password" :placeholder="$t('b7.settings.old')" autocomplete="current-password" data-b9="pwd-old" /></div>
      <div class="field" v-if="needCode" style="display:flex;gap:8px"><input v-model="code" inputmode="numeric" :placeholder="$t('b9.pwd.code')" style="flex:1" data-b9="pwd-code" />
        <button class="btn ghost" style="width:auto;padding:0 12px" :disabled="cd > 0 || !account" data-b9="pwd-send" @click="sendCode">{{ cd > 0 ? cd + 's' : $t('b9.pwd.send') }}</button></div>
      <p v-if="needCode" class="note">{{ account ? $t('b9.pwd.sendTo', { a: account }) : $t('b9.pwd.noAccount') }}</p>
      <div class="field"><input v-model="np" type="password" :placeholder="$t('b7.settings.new')" autocomplete="new-password" :maxlength="rule.max" data-b9="pwd-new" /></div>
      <div class="field"><input v-model="np2" type="password" :placeholder="$t('b7.settings.again')" autocomplete="new-password" :maxlength="rule.max" data-b9="pwd-new2" /></div>
      <p class="note" data-b9="pwd-rule">{{ $t('b9.pwd.rule', rule) }}</p>
      <p v-if="okMsg" class="okmsg" role="status" data-b9="pwd-okmsg">✓ {{ okMsg }}</p>
      <button class="btn" style="margin-top:12px" :disabled="busy" data-b9="pwd-save" @click="save">{{ $t('common.confirm') }}</button>
      <p class="note" style="text-align:center;margin-top:14px"><router-link to="/forgot" class="lnk">{{ $t('b7.forgot.title') }}</router-link></p>
    </template>
  </div></section></template>
<script setup lang="ts">
// B7 #7 / B9 #2 #7: password.
//  - no password yet (code-registered: /user/index has_password=0): B10 — code (event changepwd) + new password -> FA /user/setPwd
//  - has one: old password -> /user/changePwd, or a code sent to the account's own email/mobile (event changepwd) -> /user/setPwd
//  - rule (length) comes from /user/index pwd_rule (FA User::PWD_MIN/MAX, \S{6,30}); 6–30 default
import { ref, computed, onMounted } from 'vue'
import Icon from '../components/Icon.vue'
import { useUser } from '../stores/user'
import { changePwd, setPwd, sendSms } from '../api/b7'
import { getUserInfo } from '../api'
import { pwdRuleOf, pwdError, hasPassword } from '../api/b7Core'
import { toast } from '../components/toast'
import { useI18n } from 'vue-i18n'
const { t } = useI18n(); const user = useUser()
const oldp = ref(''); const np = ref(''); const np2 = ref(''); const code = ref(''); const busy = ref(false); const cd = ref(0)
const way = ref<'old' | 'code'>('old')
// FE-M1 QA-R1-4：发码、设密码成功后除了 toast，再在表单里留一条成功提示（toast 只停留 1.8 秒，容易错过）
const okMsg = ref('')
const hasPwd = computed(() => hasPassword(user.info))
// B10 追加#3: 首次设置密码也必须验证码（FA setPwd 不再只凭登录 token）
const needCode = computed(() => !hasPwd.value || way.value === 'code')
const rule = computed(() => pwdRuleOf(user.info))
const account = computed(() => String(user.info?.email || user.info?.mobile || ''))
async function refresh() { const r = await getUserInfo(); if (r.code === 1) user.info = r.data?.userinfo || r.data }
onMounted(async () => { if (user.token && !user.info) await refresh() })
async function sendCode() {
  okMsg.value = ''; const r = await sendSms(account.value, 'changepwd')
  if (r.code === 1) { okMsg.value = t('fem1.codeSent', { a: account.value }); toast(okMsg.value, 3000) } else toast(r.msg || t('b7.fail'))
  if (r.code === 1) { cd.value = 60; const tm = setInterval(() => --cd.value <= 0 && clearInterval(tm), 1000) }
}
async function save() {
  const e = pwdError(np.value, rule.value); if (e) return toast(t('b9.pwd.rule', rule.value))
  if (np.value !== np2.value) return toast(t('b7.settings.mismatch'))
  if (hasPwd.value && way.value === 'old' && !oldp.value) return toast(t('b7.settings.old'))
  if (needCode.value && !code.value) return toast(t('b9.pwd.code'))
  busy.value = true; okMsg.value = ''
  const r = hasPwd.value && way.value === 'old' ? await changePwd(oldp.value, np.value) : await setPwd(np.value, code.value)
  busy.value = false
  if (r.code === 1) { if (r.data?.token) user.setToken(r.data.token); okMsg.value = t('fem1.pwdSaved'); toast(okMsg.value, 3000); oldp.value = np.value = np2.value = code.value = ''; await refresh() } else toast(r.msg || t('b7.fail'))
}
</script>
<style scoped>
.okmsg{margin:10px 0 0;padding:10px 12px;border-radius:10px;background:#16a34a22;color:#4ade80;font-size:13px}
.seg2{display:flex;gap:8px;margin:6px 0 10px}
.seg2 span{flex:1;text-align:center;padding:8px;border-radius:10px;background:var(--card,#1c1c22);opacity:.7;cursor:pointer}
.seg2 span.on{opacity:1;outline:1px solid var(--accent,#ff4d6d)}
</style>
