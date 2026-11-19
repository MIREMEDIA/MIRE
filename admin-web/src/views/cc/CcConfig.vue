<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { NCard, NTabs, NTabPane, NInput, NInputNumber, NSelect, NSwitch, NButton, NSpace, NDynamicInput, NDynamicTags, NAlert, NForm, NFormItem, useMessage } from 'naive-ui'
import { api } from '../../api'
import { can } from '../../cc'
const msg = useMessage()
const C = ref<any>({}), base = ref<any[]>([])
const keys = ['models', 'templates', 'prescreen', 'review', ...(can('cc.finance') ? ['finance'] : [])]
async function load() {
  for (const k of keys) { const r: any = await api('cc.cfg.get', { key: k }); C.value[k] = r.value; if (k === 'templates') base.value = r.base_genres || [] }
  if (!C.value.templates.genres) C.value.templates.genres = []
  if (C.value.models.temperature === undefined) C.value.models.temperature = null
}
async function save(k: string) { try { C.value[k] = await api('cc.cfg.save', {}, { key: k, value: C.value[k] }); msg.success('已保存 · Studio 下一次请求即生效（未配置则回退 config.php）') } catch (e: any) { msg.error(e.message) } }
function override(g: any) { if (!C.value.templates.genres.find((x: any) => x.code === g.code)) C.value.templates.genres.push({ code: g.code, zh: g.zh, en: g.en, tropes: g.tropes || '', tropes_zh: g.tropes_zh || '', status: 'on' }) }
onMounted(load)
</script>
<template>
  <n-card size="small" title="模型与模板配置">
    <template #header-extra><span class="muted">配置保存在 Studio 存储 settings 表；Studio 优先读取此处，缺省时回退到 private/studio/config.php。API Key 仍只放在 config.php，不在后台展示。</span></template>
    <n-tabs v-if="C.models" type="line">
      <n-tab-pane name="m" tab="模型档位 & 单价">
        <n-space align="center" style="margin-bottom:10px"><span>LLM 模型覆盖</span><n-input v-model:value="C.models.llm_model" placeholder="留空 = 使用 config.php 中 llm.model" style="width:260px" />
          <span>temperature</span><n-input-number v-model:value="C.models.temperature" :min="0" :max="2" :step="0.1" clearable placeholder="默认" style="width:120px" /></n-space>
        <n-dynamic-input v-model:value="C.models.tiers" :on-create="()=>({task:'video',tier:'standard',provider:'',model:'',cost_usd:0,spark:0,status:'on'})">
          <template #default="{ value }"><n-space align="center" :wrap="false">
            <n-select v-model:value="value.task" style="width:100px" :options="['llm','image','video','tts'].map(v=>({label:v,value:v}))" />
            <n-input v-model:value="value.tier" placeholder="档位" style="width:100px" /><n-input v-model:value="value.provider" placeholder="供应商" style="width:150px" />
            <n-input v-model:value="value.model" placeholder="模型" style="width:150px" /><span>$</span><n-input-number v-model:value="value.cost_usd" :step="0.001" style="width:100px" />
            <span>Spark</span><n-input-number v-model:value="value.spark" style="width:90px" /><n-switch :value="value.status==='on'" @update:value="(v:boolean)=>value.status=v?'on':'off'" />
          </n-space></template>
        </n-dynamic-input>
        <n-button type="primary" style="margin-top:12px" @click="save('models')">保存模型配置</n-button>
      </n-tab-pane>
      <n-tab-pane name="t" tab="题材模板 & 提示词">
        <div class="muted" style="margin-bottom:6px">内置题材（来自 Studio Genres.php，点击“覆盖”可改写或停用）</div>
        <n-space style="margin-bottom:10px" size="small"><n-button v-for="g in base" :key="g.code" size="tiny" @click="override(g)">{{ g.zh }} · {{ g.code }}</n-button></n-space>
        <n-dynamic-input v-model:value="C.templates.genres" :on-create="()=>({code:'',zh:'',en:'',tropes:'',tropes_zh:'',status:'on'})">
          <template #default="{ value }"><n-space align="center" :wrap="false">
            <n-input v-model:value="value.code" placeholder="code" style="width:110px" /><n-input v-model:value="value.zh" placeholder="中文名" style="width:110px" /><n-input v-model:value="value.en" placeholder="English" style="width:130px" />
            <n-input v-model:value="value.tropes_zh" placeholder="套路要素（中文）" style="width:260px" /><n-input v-model:value="value.tropes" placeholder="tropes (EN)" style="width:200px" />
            <n-switch :value="value.status!=='off'" @update:value="(v:boolean)=>value.status=v?'on':'off'" />
          </n-space></template>
        </n-dynamic-input>
        <div class="muted" style="margin:12px 0 6px">全局附加系统提示词（追加到 Studio 每次 LLM 调用的 system prompt）</div>
        <n-input v-model:value="C.templates.prompt_extra" type="textarea" :rows="4" placeholder="例：所有剧情必须符合平台内容规范，不得出现真实明星姓名…" />
        <n-button type="primary" style="margin-top:12px" @click="save('templates')">保存模板</n-button>
      </n-tab-pane>
      <n-tab-pane name="p" tab="AI 预审规则">
        <n-alert type="info" style="margin-bottom:10px" title="离线启发式预审（未配置审核模型 Key 时生效）：命中关键词按权重累加；勾选“红线”的类别命中即自动驳回。" />
        <n-dynamic-input v-model:value="C.prescreen.rules" :on-create="()=>({cat:'',weight:10,red:false,words:[]})">
          <template #default="{ value }"><div style="width:100%;border:1px solid #eee;border-radius:6px;padding:8px">
            <n-space align="center"><n-input v-model:value="value.cat" placeholder="类别" style="width:140px" /><span>权重</span><n-input-number v-model:value="value.weight" :min="0" :max="100" style="width:90px" /><span>红线</span><n-switch v-model:value="value.red" /></n-space>
            <n-dynamic-tags v-model:value="value.words" style="margin-top:6px" />
          </div></template>
        </n-dynamic-input>
        <n-button type="primary" style="margin-top:12px" @click="save('prescreen')">保存预审规则</n-button>
      </n-tab-pane>
      <n-tab-pane name="r" tab="审核参数">
        <n-form label-placement="left" label-width="140" style="max-width:520px">
          <n-form-item label="普通队列上限（<）"><n-input-number v-model:value="C.review.low" :min="0" :max="100" /></n-form-item>
          <n-form-item label="自动驳回阈值（>）"><n-input-number v-model:value="C.review.high" :min="0" :max="100" /></n-form-item>
          <n-form-item label="审核 SLA（小时）"><n-input-number v-model:value="C.review.sla_hours" :min="1" /></n-form-item>
          <n-form-item label="最少免费集数"><n-input-number v-model:value="C.review.min_free_episodes" :min="0" /></n-form-item>
          <n-form-item label="单集最高定价（币）"><n-input-number v-model:value="C.review.max_price" :min="1" /></n-form-item>
          <n-button type="primary" @click="save('review')">保存审核参数</n-button>
        </n-form>
      </n-tab-pane>
      <n-tab-pane v-if="C.finance" name="f" tab="财务参数">
        <n-form label-placement="left" label-width="140" style="max-width:520px">
          <n-form-item label="1 金币 = $"><n-input-number v-model:value="C.finance.coin_usd" :step="0.001" /></n-form-item>
          <n-form-item label="渠道费 %"><n-input-number v-model:value="C.finance.channel_fee_pct" :min="0" :max="100" /></n-form-item>
          <n-form-item label="退款扣除 %"><n-input-number v-model:value="C.finance.refund_pct" :min="0" :max="100" /></n-form-item>
          <n-form-item label="创作者分成 %"><n-input-number v-model:value="C.finance.creator_share_pct" :min="0" :max="100" /></n-form-item>
          <n-form-item label="最低提现 $"><n-input-number v-model:value="C.finance.min_withdraw_usd" :min="0" /></n-form-item>
          <n-form-item label="提现需 KYC"><n-switch v-model:value="C.finance.kyc_required" /></n-form-item>
          <n-button type="primary" @click="save('finance')">保存财务参数</n-button>
        </n-form>
      </n-tab-pane>
    </n-tabs>
  </n-card>
</template>
