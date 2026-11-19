<script setup lang="ts">
import PageLoading from '../../components/PageLoading.vue'
import MTable from '../../components/MTable.vue'
import { h, onMounted, ref } from 'vue'
import { NCard, NTabs, NTabPane, NButton, NSpace, NInput, NSelect, NTag, NImage, NModal, NForm, NFormItem, useMessage } from 'naive-ui'
import { api } from '../../api'
import { asset, fmtTime } from '../../cc'
const msg = useMessage()
const d = ref<any>(null), creators = ref<any[]>([]), au = ref<any>(null), td = ref<any>(null), tdu = ref<any>(null)
const aSt: Record<string, [string, any]> = { valid: ['有效', 'success'], pending: ['待核验', 'warning'], revoked: ['已撤销', 'error'] }
const tSt: Record<string, [string, any]> = { open: ['待处理', 'error'], processing: ['处理中', 'warning'], done: ['已下架/完成', 'success'], rejected: ['不成立', 'default'] }
const tType: Record<string, string> = { copyright: '版权', likeness: '肖像权', voice: '声音权', other: '其他' }
const tag = (m: any) => (m ? h(NTag, { size: 'small', type: m[1], bordered: false }, () => m[0]) : '—')
async function load() { d.value = await api('cc.comp.list'); creators.value = await api('cc.creator.list') }
async function saveAuth() { try { await api('cc.comp.auth_save', {}, au.value); msg.success('已保存'); au.value = null; load() } catch (e: any) { msg.error(e.message) } }
async function saveTd() { try { await api('cc.comp.takedown_save', {}, td.value); msg.success('已登记'); td.value = null; load() } catch (e: any) { msg.error(e.message) } }
async function updTd() { try { await api('cc.comp.takedown_save', {}, tdu.value); tdu.value = null; load() } catch (e: any) { msg.error(e.message) } }
onMounted(load)
</script>
<template>
  <PageLoading v-if="!d" />
  <n-card v-if="d" size="small" title="合规与授权">
    <n-tabs type="line">
      <n-tab-pane name="l" :tab="`真人肖像上传 (${d.likeness.length})`">
        <m-table size="small" :data="d.likeness" :columns="[{title:'参考图',key:'file',width:70,render:(r:any)=>h(NImage,{src:asset(r.file),width:44,height:56,objectFit:'cover'})},{title:'角色',key:'character'},{title:'作品',key:'project'},{title:'创作者',key:'creator'},{title:'声明类型',key:'likeness_type'},{title:'授权确认',key:'confirmed',render:(r:any)=>tag(r.confirmed?['创作者已确认授权','success']:['未确认','error'])},{title:'上传时间',key:'time',render:(r:any)=>fmtTime(r.time)}]" />
      </n-tab-pane>
      <n-tab-pane name="a" :tab="`肖像 / 声音授权 (${d.authorizations.length})`">
        <n-button size="small" type="primary" style="margin-bottom:8px" @click="au={kind:'likeness',status:'pending',creator_id:null,subject:'',character:'',scope:'',doc_ref:'',expires:''}">+ 登记授权</n-button>
        <m-table size="small" :data="d.authorizations" :columns="[{title:'#',key:'id',width:50},{title:'类型',key:'kind',render:(r:any)=>r.kind==='voice'?'声音':'肖像'},{title:'创作者',key:'c',render:(r:any)=>r.creator?.display_name},{title:'授权人',key:'subject'},{title:'角色',key:'character'},{title:'范围',key:'scope'},{title:'凭证',key:'doc_ref'},{title:'到期',key:'expires'},{title:'状态',key:'status',render:(r:any)=>tag(aSt[r.status])},{title:'',key:'op',render:(r:any)=>h(NButton,{size:'tiny',onClick:()=>au={...r}},()=>'编辑')}]" />
      </n-tab-pane>
      <n-tab-pane name="t" :tab="`下架 / 投诉 (${d.takedowns.length})`">
        <n-button size="small" type="primary" style="margin-bottom:8px" @click="td={type:'copyright',complainant:'',contact:'',target:'',detail:'',publish_id:0}">+ 登记投诉</n-button>
        <m-table size="small" :data="d.takedowns" :columns="[{title:'#',key:'id',width:50},{title:'类型',key:'type',render:(r:any)=>tType[r.type]},{title:'投诉方',key:'complainant'},{title:'涉及作品',key:'target'},{title:'说明',key:'detail',ellipsis:{tooltip:true}},{title:'处理时限',key:'due',render:(r:any)=>fmtTime(r.due)},{title:'状态',key:'status',render:(r:any)=>tag(tSt[r.status])},{title:'进度',key:'log',render:(r:any)=>(r.log||[]).map((l:any)=>l.by+'：'+(l.note||l.status)).join(' / ')||'—'},{title:'',key:'op',render:(r:any)=>h(NButton,{size:'tiny',onClick:()=>tdu={id:r.id,status:r.status,note:''}},()=>'处理')}]" />
      </n-tab-pane>
    </n-tabs>
  </n-card>
  <n-modal :show="!!au" preset="card" title="肖像 / 声音授权" style="width:560px" @close="au=null">
    <n-form v-if="au" label-placement="left" label-width="80">
      <n-form-item label="类型"><n-select v-model:value="au.kind" :options="[{label:'肖像',value:'likeness'},{label:'声音',value:'voice'}]" /></n-form-item>
      <n-form-item label="创作者"><n-select v-model:value="au.creator_id" :options="creators.map((c:any)=>({label:c.display_name,value:c.id}))" /></n-form-item>
      <n-form-item label="授权人"><n-input v-model:value="au.subject" /></n-form-item>
      <n-form-item label="角色"><n-input v-model:value="au.character" /></n-form-item>
      <n-form-item label="授权范围"><n-input v-model:value="au.scope" /></n-form-item>
      <n-form-item label="凭证编号"><n-input v-model:value="au.doc_ref" /></n-form-item>
      <n-form-item label="到期日"><n-input v-model:value="au.expires" placeholder="YYYY-MM-DD" /></n-form-item>
      <n-form-item label="状态"><n-select v-model:value="au.status" :options="Object.entries(aSt).map(([v,l])=>({value:v,label:l[0]}))" /></n-form-item>
      <n-space justify="end"><n-button type="primary" @click="saveAuth">保存</n-button></n-space>
    </n-form>
  </n-modal>
  <n-modal :show="!!td" preset="card" title="登记下架 / 侵权投诉" style="width:560px" @close="td=null">
    <n-form v-if="td" label-placement="left" label-width="80">
      <n-form-item label="类型"><n-select v-model:value="td.type" :options="Object.entries(tType).map(([v,l])=>({value:v,label:l}))" /></n-form-item>
      <n-form-item label="投诉方"><n-input v-model:value="td.complainant" /></n-form-item>
      <n-form-item label="联系方式"><n-input v-model:value="td.contact" /></n-form-item>
      <n-form-item label="涉及作品"><n-input v-model:value="td.target" /></n-form-item>
      <n-form-item label="说明"><n-input v-model:value="td.detail" type="textarea" /></n-form-item>
      <n-space justify="end"><n-button type="primary" @click="saveTd">登记（3 天处理时限）</n-button></n-space>
    </n-form>
  </n-modal>
  <n-modal :show="!!tdu" preset="card" title="处理投诉" style="width:460px" @close="tdu=null">
    <template v-if="tdu"><n-select v-model:value="tdu.status" :options="Object.entries(tSt).map(([v,l])=>({value:v,label:l[0]}))" />
      <n-input v-model:value="tdu.note" placeholder="处理说明" style="margin:8px 0" /><n-button type="primary" block @click="updTd">保存</n-button></template>
  </n-modal>
</template>
