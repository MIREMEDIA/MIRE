<script setup lang="ts">
// FE-M5 个人资料：改自己的昵称 / 密码。接口规格见 /workspace/fe_audit/m5/profile_api.md（adm.profile.*，后端待实现）
import { computed, onMounted, reactive, ref } from 'vue'
import { NCard, NInput, NButton, NDescriptions, NDescriptionsItem, useMessage } from 'naive-ui'
import { api, tokenKey, logout } from '../api'
import { loadAdm } from '../adm'
import { loadPerms } from '../cc'
import { isMobile } from '../mobile'
import PageLoading from '../components/PageLoading.vue'
defineProps<{ page: any }>()
const msg = useMessage()
const local = JSON.parse(localStorage.getItem('mire_user') || '{}')
const me = ref<any>(null); const loading = ref(true); const busy = ref('')
const nick = ref<string>(local.nickname || '')
const pw = reactive({ old: '', n1: '', n2: '' })
const errs = reactive<Record<string, string>>({})
// 后端未上线（404/405 或 not found）时友好提示，不当作报错
function fail(e: any) { msg.error(e?.code === 403 ? '无权限：' + e.message : (e?.message || '保存失败，请稍后再试')) }
onMounted(async () => {
  try { me.value = await api('adm.profile.get'); nick.value = me.value.nickname || nick.value }
  catch (e: any) { msg.error(e.message); me.value = { id: local.id, username: local.username, nickname: local.nickname } }
  finally { loading.value = false }
})
function vNick() { const v = nick.value.trim(); errs.nick = !v ? '请填写昵称' : v.length > 50 ? '昵称最多 50 个字' : ''; return !errs.nick }
function vPw() {
  errs.old = pw.old ? '' : '请输入原密码'
  errs.n1 = !pw.n1 ? '请输入新密码' : pw.n1.length < 6 || pw.n1.length > 30 ? '密码 6–30 位' : pw.n1 === pw.old ? '新密码不能和原密码相同' : ''
  errs.n2 = pw.n2 !== pw.n1 ? '两次输入的新密码不一致' : ''
  return !errs.old && !errs.n1 && !errs.n2
}
async function saveNick() {
  if (!vNick()) return; busy.value = 'nick'
  try { const r: any = await api('adm.profile.save', {}, { nickname: nick.value.trim() }); const n = r?.nickname ?? nick.value.trim()
    localStorage.setItem('mire_user', JSON.stringify({ ...JSON.parse(localStorage.getItem('mire_user') || '{}'), nickname: n })); window.dispatchEvent(new Event('mire-user'))
    if (me.value) me.value.nickname = n; msg.success('昵称已保存') }
  catch (e: any) { fail(e) } finally { busy.value = '' }
}
async function savePw() {
  if (!vPw()) return; busy.value = 'pw'; errs.old = ''
  try {
    const r: any = await api('adm.profile.password', {}, { old_password: pw.old, new_password: pw.n1 }); pw.old = pw.n1 = pw.n2 = ''
    // FE-M6：后端改密会让旧 token 失效；返回新 token 则原地替换（会话不掉线），否则提示后去登录页
    // 字段以 B21.4 后端 adm_profile.php 为准：out({ok,relogin:false,token}) → api() 解包后即 r.token；兼容 data.token / new_token
    const nt: string = r?.token || r?.data?.token || r?.new_token || r?.data?.new_token || ''
    if (nt) { localStorage.setItem(tokenKey, nt); await Promise.all([loadAdm(true), loadPerms(true)]); msg.success('密码已修改') }
    else { msg.success('密码已修改，请重新登录'); setTimeout(logout, 1200) }
  }
  catch (e: any) { if (e?.code === 400 && /原密码/.test(e.message)) errs.old = e.message; fail(e) } finally { busy.value = '' }
}
const ts = (t: any) => t ? new Date(Number(t) * 1000).toLocaleString('zh-CN', { hour12: false }) : '—'
const cols = computed(() => isMobile.value ? 1 : 2)
</script>
<template>
  <div class="m5p" data-m5="profile">
    <PageLoading v-if="loading" :rows="4" />
    <template v-else>
      <n-card size="small" title="账号信息" style="margin-bottom:12px">
        <n-descriptions :column="cols" label-placement="left" size="small">
          <n-descriptions-item label="ID">{{ me?.id ?? '—' }}</n-descriptions-item>
          <n-descriptions-item label="用户名">{{ me?.username || '—' }}</n-descriptions-item>
          <n-descriptions-item label="角色组">{{ me?.groups?.join('、') || '—' }}</n-descriptions-item>
          <n-descriptions-item label="上次登录">{{ ts(me?.logintime) }}</n-descriptions-item>
        </n-descriptions>
      </n-card>
      <n-card size="small" title="修改昵称" style="margin-bottom:12px">
        <div class="m5f"><label>昵称<span class="req">*</span><n-input v-model:value="nick" maxlength="50" show-count data-m5="nick" @input="errs.nick = ''" /><small v-if="errs.nick" class="b10-err">{{ errs.nick }}</small></label></div>
        <n-button type="primary" :loading="busy === 'nick'" data-m5="save-nick" @click="saveNick">保存昵称</n-button>
      </n-card>
      <n-card size="small" title="修改密码">
        <div class="m5f">
          <label>原密码<span class="req">*</span><n-input v-model:value="pw.old" type="password" show-password-on="click" data-m5="pw-old" /><small v-if="errs.old" class="b10-err">{{ errs.old }}</small></label>
          <label>新密码<span class="req">*</span><n-input v-model:value="pw.n1" type="password" show-password-on="click" placeholder="6–30 位" data-m5="pw-new" /><small v-if="errs.n1" class="b10-err">{{ errs.n1 }}</small></label>
          <label>确认新密码<span class="req">*</span><n-input v-model:value="pw.n2" type="password" show-password-on="click" data-m5="pw-new2" /><small v-if="errs.n2" class="b10-err">{{ errs.n2 }}</small></label>
        </div>
        <n-button type="primary" :loading="busy === 'pw'" data-m5="save-pw" @click="savePw">修改密码</n-button>
      </n-card>
    </template>
  </div>
</template>
<style scoped>
.m5p{max-width:720px}
.m5f{display:grid;gap:12px;margin-bottom:12px}
.m5f label{display:flex;flex-direction:column;gap:4px;font-size:13px}
.req{color:#d03050;margin-left:2px}
</style>
