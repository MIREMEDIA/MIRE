<template><section class="scr">
  <div class="top"><span class="ic" @click="$router.back()">✕</span><div style="flex:1"></div></div>
  <div class="body" style="padding:0 24px 40px">
    <div style="text-align:center;margin:10px 0 24px"><img src="/mire_drama_logo_on_dark.png" style="height:40px" /><p class="sub" style="margin-top:12px">{{ $t('login.hint') }}</p></div>
    <button class="sso" @click="third('google')"><b style="color:#4285F4">G</b> {{ $t('login.google') }}</button>
    <button class="sso" @click="third('apple')"> {{ $t('login.apple') }}</button>
    <p class="sub" style="text-align:center;margin:18px 0 4px">— {{ $t('login.or') }} —</p>
    <div class="field"><input v-model="email" type="email" :placeholder="$t('login.email')" autocomplete="email" /></div>
    <div class="field" v-if="!usePwd"><input v-model="code" inputmode="numeric" :placeholder="$t('login.code')" /><a @click="send">{{ cd ? cd + 's' : $t('login.send') }}</a></div>
    <div class="field" v-else><input v-model="pwd" type="password" :placeholder="$t('login.pwd')" autocomplete="current-password" /></div>
    <div class="field" v-if="!usePwd"><input v-model="invite" inputmode="numeric" maxlength="40" :placeholder="$t('b7.invite.field')" /></div>
    <button class="btn" style="margin-top:18px" @click="submit">{{ $t('login.submit') }}</button>
    <p style="text-align:center;margin-top:14px;font-size:13px;color:var(--red)" @click="usePwd = !usePwd">{{ usePwd ? $t('login.useCode') : $t('login.usePwd') }}</p>
    <p v-if="usePwd" style="text-align:center;margin:-4px 0 10px;font-size:13px"><router-link to="/forgot" class="lnk">{{ $t('b7.forgot.title') }}</router-link></p>
    <label class="note" style="display:flex;gap:8px;align-items:flex-start"><input type="checkbox" v-model="agree" style="font-size:16px" /> <span>{{ $t('login.agree') }} <router-link to="/doc/terms" style="color:var(--red)">{{ $t('me.terms') }}</router-link> · <router-link to="/doc/privacy" style="color:var(--red)">{{ $t('me.privacy') }}</router-link></span></label>
  </div></section></template>
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { sendCode, codeLogin, accountLogin, thirdH5 } from '../api'
import { useUser } from '../stores/user'
import { toast } from '../components/toast'
import { inviteSpm, inviteFromLink, safeRedirect } from '../api/b7Core'
import { useI18n } from 'vue-i18n'
// All calls below are the existing live endpoints with the live front end's exact params; fired only by user taps.
const user = useUser(); const router = useRouter(); const route = useRoute()
const email = ref(''); const code = ref(''); const pwd = ref(''); const usePwd = ref(false); const agree = ref(false); const cd = ref(0)
// B7 #5: attribution = typed invite code (-> spm <uid>.1.0.1.3) > link spm/link_sign captured at app start (main.ts) > current URL
const { t } = useI18n(); const q = new URLSearchParams(location.search)
// B9 #8: entering via an invite/share link prefills the code (?invite= / ?code= / spm of the link, also the spm main.ts stored at app start)
const invite = ref(inviteFromLink({ ...Object.fromEntries(q), ...route.query } as any, localStorage.getItem('mire_spm'))); const stored = (k: string) => q.get(k) || localStorage.getItem('mire_' + k) || ''
const spm = () => inviteSpm(invite.value) || stored('spm'); const linkSign = () => stored('link_sign')
// B9 #6: after login go to ?redirect= or the page that sent us here (history.state.back), never back to /login|/forgot; replace so Back doesn't return to the form
const done = () => router.replace(safeRedirect(route.query.redirect, (window.history.state as any)?.back))
const ok = () => { if (!agree.value) { toast(t('b7.login.agree')); return false } if (!/^\S+@\S+\.\S+$/.test(email.value)) { toast(t('b7.forgot.badEmail')); return false } if (invite.value.trim() && !inviteSpm(invite.value)) { toast(t('b7.invite.bad')); return false } return true }
async function send() { if (cd.value || !ok()) return; const r = await sendCode({ account: email.value, nation_code: '', event: 'mobilelogin' }); toast(r.msg || t('b7.ok')); if (r.code === 1) { cd.value = 60; const t = setInterval(() => --cd.value <= 0 && clearInterval(t), 1000) } }
async function submit() { if (!ok()) return
  const r = usePwd.value ? await accountLogin({ account: email.value, password: pwd.value, nation_code: '' })
    : await codeLogin({ guest_user_id: '', account: email.value, captcha: code.value, nation_code: '', platform: 'H5', spm: spm(), link_sign: linkSign() })
  if (r.code === 1 && r.data?.token) { user.setToken(r.data.token); done() } else toast(r.msg || t('b7.fail')) }
async function third(type: string) { if (!agree.value) return toast(t('b7.login.agree'))
  const r = await thirdH5({ type, guest_user_id: '', redirect_url: location.href.split('#')[0], spm: spm(), link_sign: linkSign(), tscode: '' })
  if (r.code === 1 && r.data?.url) location.href = r.data.url; else toast(r.msg || t('b7.fail')) }
</script>
