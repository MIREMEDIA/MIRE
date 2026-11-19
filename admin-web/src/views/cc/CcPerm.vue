<script setup lang="ts">
import MTable from '../../components/MTable.vue'
import { h, onMounted, ref } from 'vue'
import { NCard, NCheckbox, NSelect, NButton, NInput, NSpace, NAlert, useMessage } from 'naive-ui'
import { api } from '../../api'
import { loadPerms } from '../../cc'
const msg = useMessage()
const d = ref<any>(null), v = ref<any>(null), newKey = ref(''), newName = ref('')
async function load() { d.value = await api('cc.perm.get'); v.value = JSON.parse(JSON.stringify(d.value.value)); if (Array.isArray(v.value.assign)) v.value.assign = {} }
function toggle(role: string, p: string, on: boolean) { const ps = v.value.roles[role].perms; const i = ps.indexOf(p); if (on && i < 0) ps.push(p); if (!on && i >= 0) ps.splice(i, 1) }
function addRole() { if (!/^[a-z][a-z0-9_]{1,20}$/.test(newKey.value)) return msg.error('角色标识：小写字母/数字'); v.value.roles[newKey.value] = { name: newName.value || newKey.value, perms: [] }; newKey.value = ''; newName.value = '' }
async function save() { try { await api('cc.perm.save', {}, { value: v.value }); msg.success('权限已保存'); await loadPerms(true); load() } catch (e: any) { msg.error(e.message) } }
onMounted(load)
</script>
<template>
  <template v-if="v">
    <n-alert type="info" style="margin-bottom:12px" title="创作中心权限独立于旧版 FastAdmin 角色组：超级管理员权限固定，且不能移除自己的权限管理权。" />
    <n-card size="small" title="角色 × 权限" style="margin-bottom:12px">
      <template #header-extra><n-space><n-input v-model:value="newKey" size="small" placeholder="角色标识 如 qa" style="width:140px" /><n-input v-model:value="newName" size="small" placeholder="名称" style="width:120px" /><n-button size="small" @click="addRole">新增角色</n-button></n-space></template>
      <m-table size="small" :data="Object.entries(v.roles).map(([k,r]:any)=>({k,...r}))" :columns="[{title:'角色',key:'name',width:140,render:(r:any)=>r.name+' ('+r.k+')'},...d.all_perms.map((p:any)=>({title:p.t,key:p.k,align:'center',render:(r:any)=>h(NCheckbox,{checked:r.perms.includes(p.k),disabled:r.k==='super',onUpdateChecked:(c:boolean)=>toggle(r.k,p.k,c)})}))]" />
    </n-card>
    <n-card size="small" title="管理员分配（vs_admin，只读读取）">
      <m-table size="small" :data="d.admins" :columns="[{title:'ID',key:'id',width:60},{title:'账号',key:'username'},{title:'昵称',key:'nickname'},{title:'状态',key:'status'},{title:'创作中心角色',key:'role',render:(r:any)=>h(NSelect,{size:'small',style:'width:180px',value:v.assign[r.username]||'super',options:Object.entries(v.roles).map(([k,x]:any)=>({label:x.name,value:k})),onUpdateValue:(x:string)=>{v.assign[r.username]=x}})}]" />
      <n-button type="primary" style="margin-top:12px" @click="save">保存权限</n-button>
    </n-card>
  </template>
</template>
