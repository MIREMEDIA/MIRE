<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api, getToken } from '../../api'
import { fmtTime } from '../../cc'
const loading=ref(true),rows=ref<any[]>([]), detail=ref<any>(null), status=ref('pending'), reason=ref(''), error=ref(''), busy=ref(false)
async function load(){loading.value=true;try{rows.value=await api('cc.kyc.list',{status:status.value})}catch(e:any){error.value=e.message}finally{loading.value=false}}
async function open(id:number){try{detail.value=await api('cc.kyc.get',{id});reason.value=''}catch(e:any){error.value=e.message}}
async function review(action:string){busy.value=true;error.value='';try{detail.value=await api('cc.kyc.review',{}, {id:detail.value.id,action,reason:reason.value});await load()}catch(e:any){error.value=e.message}finally{busy.value=false}}
async function download(id:string){try{
  const fresh:any=await api('cc.kyc.get',{id:detail.value.id}),f=fresh.files.find((x:any)=>x.id===id)
  const res=await fetch('./api/'+f.url,{headers:{'X-Token':getToken()}});if(!res.ok)throw new Error('下载失败或链接已过期')
  const blob=await res.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=f.slot+'.'+({'image/png':'png','image/jpeg':'jpg','image/webp':'webp','application/pdf':'pdf'}[blob.type]||'bin');a.click();setTimeout(()=>URL.revokeObjectURL(url),2000)
}catch(e:any){error.value=e.message}}
onMounted(load)
</script>
<template><section><h2>KYC 实名审核</h2><p role="alert" style="color:#c33">{{error}}</p>
<label>状态 <select v-model="status" @change="load"><option value="pending">待审核</option><option value="all">全部历史</option><option value="verified">已通过</option><option value="rejected">已驳回</option></select></label> <button @click="load">刷新</button>
<div class="tbl-x" data-tbl-x><table style="width:100%;margin-top:20px;text-align:left"><thead><tr><th>ID</th><th>创作者</th><th>姓名</th><th>国家</th><th>状态</th><th>提交时间</th><th></th></tr></thead><tbody><tr v-for="r in rows" :key="r.id"><td>{{r.id}}</td><td>{{r.creator_id}}</td><td>{{r.legal_name}}</td><td>{{r.country}}</td><td>{{r.status}}</td><td>{{fmtTime(r.createtime)}}</td><td><button @click="open(r.id)">查看</button></td></tr></tbody></table></div><p v-if="loading">加载中…</p><p v-else-if="!rows.length">暂无记录</p>
<article v-if="detail" style="margin-top:28px"><h3>申请 #{{detail.id}} · {{detail.status}}</h3><p>{{detail.legal_name}} · {{detail.country}} · {{detail.birth_date}}</p><p>{{detail.id_type}} · ****{{detail.id_last4}}</p><p>{{detail.reason}}</p><button v-for="f in detail.files" :key="f.id" @click="download(f.id)">{{f.slot}} ↓</button>
<form v-if="detail.status==='pending'" @submit.prevent="review('approve')" style="margin-top:20px"><label>审核原因（驳回必填，通过可选）<br><textarea v-model="reason" required maxlength="2000" rows="4" style="width:100%"></textarea></label><button :disabled="busy || !reason.trim()">通过</button> <button type="button" :disabled="busy || !reason.trim()" @click="review('reject')">驳回</button></form></article>
</section></template>
