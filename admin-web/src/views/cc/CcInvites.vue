<script setup lang="ts">
import MTable from '../../components/MTable.vue'
import { h, onMounted, reactive, ref } from 'vue'
import { NCard, NInput, NInputNumber, NSelect, NButton, NSpace, NTag, useMessage } from 'naive-ui'
import { api } from '../../api'
import { fmtTime, levelLabel } from '../../cc'
const msg = useMessage()
const rows = ref<any[]>([]), f = reactive({ code: '', count: 1, max_uses: 1, expires_days: 30, level: 'invited', note: '' })
const now = Date.now() / 1000
const stat = (r: any) => r.status === 'disabled' ? ['已停用', 'default'] : r.expires && r.expires < now ? ['已过期', 'warning'] : r.max_uses && r.used >= r.max_uses ? ['已用完', 'info'] : ['可用', 'success']
const cols: any[] = [
  { title: '邀请码', key: 'code', render: (r: any) => h('code', { style: 'font-weight:700' }, r.code) },
  { title: '状态', key: 'status', width: 90, render: (r: any) => { const s = stat(r); return h(NTag, { size: 'small', type: s[1] as any, bordered: false }, () => s[0]) } },
  { title: '已用/上限', key: 'used', width: 100, render: (r: any) => `${r.used} / ${r.max_uses || '∞'}` },
  { title: '默认等级', key: 'level', width: 100, render: (r: any) => levelLabel[r.level] || r.level },
  { title: '有效期至', key: 'expires', width: 160, render: (r: any) => r.expires ? fmtTime(r.expires) : '长期' },
  { title: '备注', key: 'note' }, { title: '创建人', key: 'by', width: 90 },
  { title: '创建时间', key: 'createtime', width: 160, render: (r: any) => fmtTime(r.createtime) },
  { title: '操作', key: 'op', width: 90, render: (r: any) => h(NButton, { size: 'small', type: r.status === 'disabled' ? 'primary' : 'error', ghost: true, onClick: () => toggle(r) }, () => (r.status === 'disabled' ? '启用' : '停用')) },
]
async function load() { rows.value = await api('cc.invite.list') }
async function create() { try { const r: any = await api('cc.invite.save', {}, { ...f }); msg.success(`已生成 ${r.length} 个邀请码`); f.code = ''; load() } catch (e: any) { msg.error(e.message) } }
async function toggle(r: any) { try { await api('cc.invite.save', {}, { id: r.id, status: r.status === 'disabled' ? 'active' : 'disabled', max_uses: r.max_uses, note: r.note, level: r.level }); load() } catch (e: any) { msg.error(e.message) } }
onMounted(load)
</script>
<template>
  <n-card size="small" title="生成邀请码" style="margin-bottom:12px">
    <template #header-extra><span class="muted">配置文件 config.php 中的邀请码仍然有效；此处生成的码保存在 Studio 存储，登录时校验状态 / 有效期 / 次数</span></template>
    <n-space align="center">
      <n-input v-model:value="f.code" placeholder="自定义码（留空自动生成）" style="width:210px" />
      <span>数量</span><n-input-number v-model:value="f.count" :min="1" :max="50" style="width:90px" />
      <span>每码可用</span><n-input-number v-model:value="f.max_uses" :min="0" style="width:90px" /><span class="muted">次(0=不限)</span>
      <span>有效</span><n-input-number v-model:value="f.expires_days" :min="0" style="width:90px" /><span class="muted">天</span>
      <n-select v-model:value="f.level" style="width:130px" :options="[{label:'受邀创作者',value:'invited'},{label:'签约创作者',value:'signed'}]" />
      <n-input v-model:value="f.note" placeholder="备注（渠道/对象）" style="width:200px" />
      <n-button type="primary" @click="create">生成</n-button>
    </n-space>
  </n-card>
  <n-card size="small" title="邀请码列表"><m-table :columns="cols" :data="rows" size="small" /></n-card>
</template>
