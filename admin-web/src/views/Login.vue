<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { NInput, NButton, NAlert } from 'naive-ui'
import { api, tokenKey } from '../api'
const logo = './logo-dark.png'
const router = useRouter()
const username = ref(''), password = ref(''), err = ref(''), errCode = ref(0), loading = ref(false)
// B21.1：401 账号或密码错误 / 403 账号停用或无后台权限，均显示后端文案
async function submit() {
  err.value = ''; errCode.value = 0
  if (!username.value || !password.value) { err.value = '请输入账号和密码'; return }
  loading.value = true
  try {
    const d = await api('login', {}, { username: username.value, password: password.value })
    localStorage.setItem(tokenKey, d.token); localStorage.setItem('mire_user', JSON.stringify(d.user || {}))
    router.replace('/p/dash')
  } catch (e: any) { err.value = e.message; errCode.value = e.code || 0 } finally { loading.value = false }
}
</script>
<template>
  <div class="wrap">
    <div class="brand">
      <img :src="logo" alt="MIRE DRAMA" />
      <h1>海外短剧运营后台</h1>
      <p>内容 · 用户 · 交易 · 增长 · 投放，一站式管理</p>
      <div class="tag">STAGING · 测试环境（videos_staging）</div>
    </div>
    <div class="panel">
      <form class="card" @submit.prevent="submit">
        <h2>登录</h2>
        <div class="muted" style="margin-bottom:20px">使用 staging 后台管理员账号登录</div>
        <n-input v-model:value="username" size="large" placeholder="管理员账号" :input-props="{ autocomplete: 'username' }" />
        <n-input v-model:value="password" size="large" type="password" show-password-on="click" placeholder="密码" style="margin-top:14px" :input-props="{ autocomplete: 'current-password' }" />
        <n-alert v-if="err" :type="errCode === 403 ? 'warning' : 'error'" data-test="login-err" :show-icon="false" style="margin-top:14px">{{ err }}</n-alert>
        <n-button attr-type="submit" type="primary" size="large" block :loading="loading" style="margin-top:22px">登 录</n-button>
        <div class="muted" style="margin-top:18px;text-align:center">本环境只连接 staging 测试库，修改不会影响线上站点与线上数据库</div>
      </form>
    </div>
  </div>
</template>
<style scoped>
.wrap{display:flex;height:100vh}
.brand{flex:1.2;background:radial-gradient(circle at 25% 20%,#2B2B2B 0,#101010 45%,#010101 100%);color:#fff;display:flex;flex-direction:column;justify-content:center;padding:0 9%;position:relative;overflow:hidden}
.brand::after{content:'';position:absolute;right:-120px;bottom:-120px;width:420px;height:420px;border-radius:50%;background:#FF2C48;opacity:.12}
.brand img{width:260px}
.brand h1{font-size:34px;margin:36px 0 8px;font-weight:700}
.brand p{color:#D4D4D4;margin:0}
.tag{margin-top:28px;display:inline-block;align-self:flex-start;border:1px solid #FF2C48;color:#FF2C48;padding:4px 12px;border-radius:20px;font-size:12px;letter-spacing:1px}
.panel{flex:1;display:flex;align-items:center;justify-content:center;background:#fff}
.card{width:360px}
.card h2{font-size:26px;margin:0 0 6px}
/* Phone: the row layout gives .brand padding:0 9% of the viewport and lets .card stay 360px, so the brand content width collapses to ~0 and the page scrolls sideways. */
@media (max-width: 767px) {
  .wrap{flex-direction:column;height:auto;min-height:100vh;min-height:100dvh}
  .wrap,.brand,.panel,.card{box-sizing:border-box}
  .brand{flex:none;width:100%;padding:28px 20px 18px;justify-content:flex-start}
  .brand img{width:auto;max-width:min(220px,100%);height:auto}
  .brand h1{font-size:22px;line-height:1.35;margin:14px 0 6px}
  .brand p{font-size:13px;line-height:1.5}
  .tag{margin-top:14px;max-width:100%;white-space:normal;letter-spacing:0}
  .panel{flex:1 0 auto;width:100%;padding:8px 16px 32px;align-items:flex-start}
  .card{width:100%;max-width:420px}
}
</style>
