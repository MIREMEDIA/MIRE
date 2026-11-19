<template><section class="scr">
  <div class="top"><span class="ic2" @click="$router.back()"><Icon name="back" /></span><h1>{{ $route.query.set ? $t('b7.settings.set') : $t('b7.forgot.title') }}</h1></div>
  <div class="body" style="padding:0 24px 40px">
    <p class="sub" style="margin:6px 0 14px">{{ $t('b7.forgot.desc') }}</p>
    <div class="field"><input v-model="acc" type="email" :placeholder="$t('login.email')" autocomplete="email" /></div>
    <div class="field"><input v-model="code" inputmode="numeric" :placeholder="$t('login.code')" /><a @click="send">{{ cd ? cd + 's' : $t('login.send') }}</a></div>
    <div class="field"><input v-model="pwd" type="password" :placeholder="$t('b7.settings.new')" autocomplete="new-password" /></div>
    <div class="field"><input v-model="pwd2" type="password" :placeholder="$t('b7.settings.again')" autocomplete="new-password" /></div>
    <p class="note">{{ $t('b7.forgot.rule') }}</p>
    <button class="btn" style="margin-top:14px" :disabled="busy" @click="submit">{{ $t('common.confirm') }}</button>
  </div></section></template>
<script setup lang="ts">
// B7 #7: FA /sms/send event=resetpwd -> /user/resetpwd (account, password 6-30, captcha)
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '../components/Icon.vue'
import { sendSms, resetPwd } from '../api/b7'
import { useUser } from '../stores/user'
import { toast } from '../components/toast'
import { useI18n } from 'vue-i18n'
const { t } = useI18n(); const router = useRouter(); const user = useUser()
const acc = ref(user.info?.email || ''); const code = ref(''); const pwd = ref(''); const pwd2 = ref(''); const cd = ref(0); const busy = ref(false)
const okAcc = () => /^\S+@\S+\.\S+$/.test(acc.value)
async function send() { if (cd.value) return; if (!okAcc()) return toast(t('b7.forgot.badEmail'))
  const r = await sendSms(acc.value, 'resetpwd'); toast(r.msg || t('b7.ok')); if (r.code === 1) { cd.value = 60; const tm = setInterval(() => --cd.value <= 0 && clearInterval(tm), 1000) } }
async function submit() {
  if (!okAcc()) return toast(t('b7.forgot.badEmail')); if (!code.value) return toast(t('login.code'))
  if (pwd.value.length < 6 || pwd.value.length > 30) return toast(t('b7.forgot.rule')); if (pwd.value !== pwd2.value) return toast(t('b7.settings.mismatch'))
  busy.value = true; const r = await resetPwd(acc.value, pwd.value, code.value); busy.value = false
  if (r.code === 1) { toast(r.msg || t('b7.ok')); router.replace(user.token ? '/settings' : '/login') } else toast(r.msg || t('b7.fail'))
}
</script>
