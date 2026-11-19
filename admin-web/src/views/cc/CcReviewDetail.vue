<script setup lang="ts">
import PageLoading from '../../components/PageLoading.vue'
import { isMobile } from '../../mobile'
import { t } from '../../i18n'
import MTable from '../../components/MTable.vue'
import { computed, h, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NCard, NButton, NSpace, NTag, NAlert, NImage, NTabs, NTabPane, NDescriptions, NDescriptionsItem, NInput, NInputNumber, NCheckbox, NTimeline, NTimelineItem, NModal, NEmpty, NCollapse, NCollapseItem, NGrid, NGi, useMessage, useDialog } from 'naive-ui'
import { api } from '../../api'
import { asset, bandLabel, pubStatus, slaText, fmtTime, langName, actionLabel, kycLabel, signLabel } from '../../cc'
const APPROVE_ZH = '确认审核通过？审核通过后作品将写入剧库并按设置上架，此操作不可撤销。'
const APPROVE_EN = 'Confirm approval? The work will be written to the drama library and listed per its settings. This cannot be undone.'
const route = useRoute(), router = useRouter(), msg = useMessage(), dialog = useDialog()
const id = computed(() => Number(route.query.id))
const d = ref<any>(null), err = ref(''), busy = ref(false)
const form = reactive({ reason: '', allow_resubmit: true, issues: [] as any[] })
const pv = ref<any>(null), showPv = ref(false)
const viewNames: Record<string, string> = { front: '正面', front_l34: '左前 3/4', left: '左侧', back_l34: '左后 3/4', back: '背面', back_r34: '右后 3/4', right: '右侧', front_r34: '右前 3/4' }
const P = computed(() => d.value?.publish || {})
const open = computed(() => ['pending', 'focus'].includes(P.value.status))
const shotsOf = (epId: number) => (d.value?.snapshot?.shots || []).filter((s: any) => s.episode_id === epId)
const hitsOf = (no: number) => (d.value?.ai?.hits || []).filter((x: any) => x.episode_no === no)
const views = (c: any) => Object.entries(c.sheet?.views || {}).map(([k, v]: any) => ({ k, n: viewNames[k] || k, f: v.file, st: v.status }))
const likeTxt: Record<string, [string, any]> = { ai_original: ['AI 原创形象', 'success'], licensed_real: ['授权真人', 'warning'], self: ['本人肖像', 'info'], unknown: ['未声明', 'error'] }
async function load() {
  err.value = ''
  try { d.value = await api('cc.review.get', { id: id.value }); if (d.value.decision?.preview) pv.value = d.value.decision.preview } catch (e: any) { err.value = e.message }
}
function addIssue(ep: number | null = null, shot: number | null = null) { form.issues.push({ episode_no: ep, shot_no: shot, text: '' }) }
const needConfirm = ['approve', 'reject', 'request_changes']
function act(action: string) {
  if (['reject', 'request_changes'].includes(action) && !form.reason.trim()) { msg.warning(t('review.need_reason')); return }
  if (!needConfirm.includes(action)) return doAct(action)
  // approve: bilingual (zh per the detail-page banner wording + CTO English), same for both UI languages
  const bi = action === 'approve'
  dialog.warning({ class: 'cc-confirm', title: bi ? '确认审核通过 / Confirm approval' : t('review.confirm.title'),
    content: bi ? () => h('div', { class: 'cc-confirm-bi' }, [h('p', { style: 'margin:0 0 6px' }, APPROVE_ZH), h('p', { style: 'margin:0', lang: 'en' }, APPROVE_EN)]) : t('review.confirm.' + action),
    positiveText: bi ? '确认 / Confirm' : t('review.confirm.ok'), negativeText: bi ? '取消 / Cancel' : t('review.confirm.cancel'), onPositiveClick: () => { void doAct(action) } })
}
async function doAct(action: string) {
  busy.value = true
  try {
    const r: any = await api('cc.review.act', {}, { id: id.value, action, reason: form.reason, issues: form.issues, allow_resubmit: form.allow_resubmit })
    msg.success(['approve', 'reject', 'request_changes', 'claim', 'note'].includes(action) ? t('review.toast.' + action) : t('review.toast.ok'))
    if (r.preview) { pv.value = r.preview; showPv.value = true }
    form.reason = ''; form.issues = []; await load()
  } catch (e: any) { msg.error(e.message) } finally { busy.value = false }
}
async function preview() { try { pv.value = await api('cc.review.preview', { id: id.value }); showPv.value = true } catch (e: any) { msg.error(e.message) } }
const vCols = computed(() => Object.keys(pv.value?.vs_dramas_video || {}).map(k => ({ title: k, key: k })))
const vRows = computed(() => Object.entries(pv.value?.vs_dramas_video || {}).map(([k, v]) => ({ k, v: typeof v === 'object' ? JSON.stringify(v) : String(v) })))
const eCols = computed(() => Object.keys((pv.value?.vs_dramas_video_episodes || [])[0] || {}).map(k => ({ title: k, key: k, ellipsis: { tooltip: true } })))
onMounted(load)
void vCols
</script>
<template>
  <n-alert v-if="err" type="error" :title="err" />
  <PageLoading v-if="!d && !err" />
  <template v-if="d">
    <n-card size="small" style="margin-bottom:12px">
      <div style="display:flex;gap:16px">
        <n-image :src="asset(P.cover)" width="96" height="136" object-fit="cover" style="border-radius:6px;flex:none" />
        <div style="flex:1;min-width:0">
          <n-space align="center">
            <n-button size="tiny" quaternary @click="router.push('/p/cc_review')">← 返回队列</n-button>
            <span style="font-size:20px;font-weight:700">{{ P.title }}</span>
            <n-tag :type="pubStatus[P.status]?.[1]" :bordered="false">{{ pubStatus[P.status]?.[0] || P.status }}</n-tag>
            <n-tag :type="bandLabel[P.band]?.[1]" :bordered="false">AI 风险 {{ P.score }} · {{ bandLabel[P.band]?.[0] }}</n-tag>
            <n-tag v-if="open" :type="slaText(P.sla_left).type" :bordered="false">SLA {{ slaText(P.sla_left).t }}</n-tag>
          </n-space>
          <div class="muted" style="margin:6px 0">提交 #{{ P.id }} · 第 {{ P.version }} 版 · 项目 #{{ P.project_id }} · {{ fmtTime(P.submitted_at) }} 提交 · 处理人 {{ P.assignee || '未认领' }}</div>
          <n-descriptions size="small" :column="isMobile ? 1 : 4" label-placement="left">
            <n-descriptions-item label="创作者">{{ P.creator?.display_name }}</n-descriptions-item>
            <n-descriptions-item label="签约">{{ signLabel[P.creator?.sign_status]?.[0] }}</n-descriptions-item>
            <n-descriptions-item label="KYC">{{ kycLabel[P.creator?.kyc_status]?.[0] }}</n-descriptions-item>
            <n-descriptions-item label="版权方 ID">{{ P.creator?.copyright_id || '未绑定' }}</n-descriptions-item>
            <n-descriptions-item label="语言">{{ langName[P.lang] || P.lang }}</n-descriptions-item>
            <n-descriptions-item label="题材">{{ P.genre }}</n-descriptions-item>
            <n-descriptions-item label="集数">{{ P.episodes }} 集（已写剧本 {{ P.scripted }}）</n-descriptions-item>
            <n-descriptions-item label="定价">前 {{ P.free_episodes }} 集免费（设定 {{ P.free_episodes_set ?? P.free_episodes }} 集）· {{ P.price_per_episode }} 币/集</n-descriptions-item>
            <n-descriptions-item label="标签" :span="4"><n-space size="small"><n-tag v-for="t in P.tags" :key="t" size="small" :bordered="false">{{ t }}</n-tag></n-space></n-descriptions-item>
            <n-descriptions-item v-if="d.description" label="简介" :span="4">{{ d.description }}</n-descriptions-item>
          </n-descriptions>
        </div>
      </div>
    </n-card>
    <n-grid :cols="24" :x-gap="12" :y-gap="isMobile ? 10 : 0">
      <n-gi :span="isMobile ? 24 : 17">
        <n-card size="small">
          <n-tabs type="line" animated>
            <n-tab-pane name="outline" tab="项目大纲">
              <n-descriptions bordered size="small" :column="1" label-placement="left" label-style="width:90px">
                <n-descriptions-item label="一句话">{{ d.snapshot.outline?.logline }}</n-descriptions-item>
                <n-descriptions-item label="故事梗概"><div style="white-space:pre-wrap">{{ d.snapshot.outline?.synopsis }}</div></n-descriptions-item>
                <n-descriptions-item label="世界观">{{ d.snapshot.outline?.world }}</n-descriptions-item>
                <n-descriptions-item label="卖点"><n-space size="small"><n-tag v-for="s in d.snapshot.outline?.selling_points || []" :key="s" type="error" size="small" :bordered="false">{{ s }}</n-tag></n-space></n-descriptions-item>
                <n-descriptions-item label="反转点"><div v-for="r in d.snapshot.outline?.reversals || []" :key="r.episode">第 {{ r.episode }} 集：{{ r.desc }}</div></n-descriptions-item>
                <n-descriptions-item label="人物"><div v-for="c in d.snapshot.outline?.characters || []" :key="c.name"><b>{{ c.name }}</b> · {{ c.gender }} · {{ c.age_range }} — {{ c.persona }}</div></n-descriptions-item>
              </n-descriptions>
            </n-tab-pane>
            <n-tab-pane name="eps" :tab="`分集剧本与分镜 (${d.snapshot.episodes.length})`">
              <n-collapse :default-expanded-names="[1]">
                <n-collapse-item v-for="e in d.snapshot.episodes" :key="e.episode_no" :name="e.episode_no">
                  <template #header>
                    <b>{{ e.title || '第' + e.episode_no + '集' }}</b>
                    <n-tag v-if="e.episode_no <= P.free_episodes" size="tiny" :bordered="false" style="margin-left:8px">免费</n-tag>
                    <n-tag v-else size="tiny" type="warning" :bordered="false" style="margin-left:8px">付费</n-tag>
                    <n-tag v-if="!e.body" size="tiny" type="error" :bordered="false" style="margin-left:4px">无剧本</n-tag>
                    <n-tag v-if="hitsOf(e.episode_no).length" size="tiny" type="error" style="margin-left:4px">AI 命中 {{ hitsOf(e.episode_no).length }}</n-tag>
                  </template>
                  <template #header-extra><n-button v-if="open" size="tiny" @click.stop="addIssue(e.episode_no)">📌 标注问题</n-button></template>
                  <div class="muted">{{ e.summary }}</div>
                  <pre class="script">{{ e.body || '（本集尚未生成剧本）' }}</pre>
                  <div v-if="shotsOf(e.id).length" class="shots">
                    <div v-for="s in shotsOf(e.id)" :key="s.id" class="shot">
                      <div><b>镜 {{ s.shot_no }}</b> <n-tag size="tiny" :bordered="false">{{ s.framing }}</n-tag> <n-tag size="tiny" :bordered="false">{{ s.camera_move }}</n-tag> <span class="muted">{{ s.duration }}s · {{ s.scene }}</span>
                        <n-button v-if="open" size="tiny" text type="primary" style="float:right" @click="addIssue(e.episode_no, s.shot_no)">📌</n-button></div>
                      <div>{{ s.action }}</div>
                      <div v-if="s.dialogue" class="muted">「{{ s.dialogue }}」</div>
                    </div>
                  </div>
                </n-collapse-item>
              </n-collapse>
            </n-tab-pane>
            <n-tab-pane name="chars" :tab="`角色 8 视图 (${d.snapshot.characters.length})`">
              <div v-for="c in d.snapshot.characters" :key="c.id" style="margin-bottom:16px">
                <n-space align="center"><b style="font-size:15px">{{ c.name }}</b><span class="muted">{{ c.role }} · {{ c.gender }}</span>
                  <n-tag size="small" :type="likeTxt[c.likeness_type || 'unknown']?.[1]" :bordered="false">{{ likeTxt[c.likeness_type || 'unknown']?.[0] || c.likeness_type }}</n-tag>
                  <n-tag v-if="c.sheet?.master?.source === 'upload'" size="small" :type="c.sheet.master.likeness_confirmed ? 'success' : 'error'">上传参考图 · {{ c.sheet.master.likeness_confirmed ? '已确认肖像授权' : '未确认授权' }}</n-tag></n-space>
                <div class="views">
                  <div v-if="c.sheet?.master?.file" class="v"><n-image :src="asset(c.sheet.master.file)" width="92" height="128" object-fit="cover" /><div>主参考</div></div>
                  <div v-for="v in views(c)" :key="v.k" class="v"><n-image v-if="v.f" :src="asset(v.f)" width="92" height="128" object-fit="cover" /><div v-else class="ph">未生成</div><div>{{ v.n }}</div></div>
                </div>
              </div>
            </n-tab-pane>
            <n-tab-pane name="ai" tab="AI 预审 & 肖像确认">
              <n-alert :type="d.ai.band === 'high' ? 'error' : d.ai.band === 'mid' ? 'warning' : 'success'" :title="`风险分 ${d.ai.score} · ${bandLabel[d.ai.band]?.[0]}${d.ai.red_line ? ' · 命中红线' : ''}`" style="margin-bottom:12px">
                引擎：{{ d.ai.engine }} · {{ d.ai.note }} · {{ fmtTime(d.ai.time) }}
              </n-alert>
              <m-table size="small" :data="d.ai.hits" :columns="[{title:'类别',key:'category'},{title:'命中',key:'word'},{title:'位置',key:'where'}]" style="margin-bottom:12px" />
              <div class="muted" style="margin-bottom:6px">真人肖像 / 声音确认</div>
              <m-table size="small" :data="d.ai.likeness" :columns="[{title:'角色',key:'character'},{title:'类型',key:'type'},{title:'创作者确认',key:'confirmed',render:(r:any)=>r.confirmed?'✅ 已确认授权':'❌ 未确认'}]" />
              <div class="muted" style="margin:12px 0 6px">已登记的授权文件（合规模块）</div>
              <m-table size="small" :data="d.authorizations" :columns="[{title:'类型',key:'kind'},{title:'授权人',key:'subject'},{title:'角色',key:'character'},{title:'范围',key:'scope'},{title:'文件',key:'doc_ref'},{title:'到期',key:'expires'},{title:'状态',key:'status'}]" />
            </n-tab-pane>
            <n-tab-pane name="log" tab="审核记录 & 审计">
              <n-timeline>
                <n-timeline-item v-for="r in d.reviews" :key="r.id" :type="r.action==='approve'?'success':['reject','auto_reject'].includes(r.action)?'error':r.action==='request_changes'?'warning':'default'" :title="`${actionLabel[r.action]||r.action} · ${r.actor}`" :time="fmtTime(r.createtime)">
                  <div v-if="r.reason">{{ r.reason }}</div>
                  <div v-for="(i,k) in r.issues" :key="k" class="issue">📌 {{ i.episode_no ? '第' + i.episode_no + '集' : '整体' }}{{ i.shot_no ? ' · 镜' + i.shot_no : '' }}：{{ i.text }}</div>
                </n-timeline-item>
              </n-timeline>
              <div class="muted" style="margin:12px 0 6px">审计日志</div>
              <m-table size="small" :data="d.audit" :columns="[{title:'时间',key:'createtime',width:160,render:(r:any)=>fmtTime(r.createtime)},{title:'操作人',key:'actor',width:120},{title:'动作',key:'action',width:160},{title:'对象',key:'target',width:110},{title:'详情',key:'detail',ellipsis:{tooltip:true},render:(r:any)=>JSON.stringify(r.detail)}]" />
              <template v-if="d.history.length > 1"><div class="muted" style="margin:12px 0 6px">历史版本</div>
                <m-table size="small" :data="d.history" :columns="[{title:'#',key:'id'},{title:'版本',key:'version'},{title:'状态',key:'status',render:(r:any)=>pubStatus[r.status]?.[0]},{title:'风险',key:'score'},{title:'提交',key:'submitted_at',render:(r:any)=>fmtTime(r.submitted_at)}]" /></template>
            </n-tab-pane>
          </n-tabs>
        </n-card>
      </n-gi>
      <n-gi :span="isMobile ? 24 : 7">
        <n-card size="small" :title="t('review.card.title')" :class="isMobile ? 'm-actions' : 'sticky'">
          <template v-if="open">
            <n-button v-if="!P.assignee" block secondary style="margin-bottom:10px" :loading="busy" @click="act('claim')">{{ t('review.btn.claim') }}</n-button>
            <n-input v-model:value="form.reason" type="textarea" :rows="3" :placeholder="t('review.ph.reason')" />
            <div class="muted" style="margin:10px 0 6px">{{ t('review.issues.hint') }}</div>
            <div v-for="(i, k) in form.issues" :key="k" class="iss">
              <n-space size="small" align="center"><span>第</span><n-input-number v-model:value="i.episode_no" size="tiny" :min="1" :max="P.episodes" style="width:72px" placeholder="集" /><span>集 镜</span><n-input-number v-model:value="i.shot_no" size="tiny" :min="1" style="width:68px" placeholder="镜" /><n-button size="tiny" text type="error" @click="form.issues.splice(k,1)">{{ t('review.issues.del') }}</n-button></n-space>
              <n-input v-model:value="i.text" size="small" :placeholder="t('review.issues.desc')" style="margin-top:4px" />
            </div>
            <n-button size="small" dashed block @click="addIssue()">+ {{ t('review.issues.add') }}</n-button>
            <n-checkbox v-model:checked="form.allow_resubmit" style="margin:10px 0">{{ t('review.allow_resubmit') }}</n-checkbox>
            <n-space vertical>
              <n-button type="primary" block :loading="busy" @click="act('approve')">{{ t('review.btn.approve') }}</n-button>
              <n-button type="warning" block ghost :loading="busy" @click="act('request_changes')">{{ t('review.btn.request_changes') }}</n-button>
              <n-button type="error" block ghost :loading="busy" @click="act('reject')">{{ t('review.btn.reject') }}</n-button>
              <n-button block quaternary @click="preview">{{ t('review.btn.preview') }}</n-button>
            </n-space>
          </template>
          <template v-else>
            <n-alert :type="P.status==='approved'?'success':'warning'" :title="pubStatus[P.status]?.[0]">
              <div v-if="d.decision">{{ d.decision.by }} · {{ fmtTime(d.decision.at) }}</div><div v-if="d.decision?.reason">{{ d.decision.reason }}</div>
            </n-alert>
            <n-button v-if="pv" block type="primary" ghost style="margin-top:10px" @click="showPv=true">{{ t('review.btn.view') }}</n-button>
            <n-input v-model:value="form.reason" type="textarea" :rows="2" :placeholder="t('review.ph.note')" style="margin-top:10px" />
            <n-button block size="small" style="margin-top:6px" @click="act('note')">{{ t('review.btn.note') }}</n-button>
          </template>
        </n-card>
      </n-gi>
    </n-grid>
    <n-modal v-model:show="showPv" preset="card" style="width:1100px" :title="pv?.written ? t('review.pv.title_written') : t('review.pv.title')">
      <template v-if="pv">
        <div class="banner" :class="{ ok: pv.written }">{{ pv.written ? t('review.pv.written') : t('review.pv.not_written') }}</div>
        <n-space style="margin:10px 0" size="small">
          <n-tag :bordered="false">{{ t('review.pv.lang') }}：{{ pv.lang?.name }}（lang_id {{ pv.lang?.id }} · {{ t('review.pv.lang_source') }} {{ pv.lang_source }}）</n-tag>
          <n-tag :bordered="false" :type="pv.copyright?.mode==='existing'?'success':'warning'">{{ t('review.pv.copyright') }}：{{ pv.copyright?.mode==='existing' ? t('review.pv.cp_existing') + ' #' + pv.copyright.id + ' ' + (pv.copyright.row?.name||'') : (pv.written ? t('review.pv.cp_created') : t('review.pv.cp_new')) + ' ' + (pv.copyright?.row?.name||'') }}</n-tag>
        </n-space>
        <n-alert v-for="w in pv.warnings || []" :key="w" type="warning" :title="w" style="margin-bottom:6px" />
        <div class="muted" style="margin:8px 0 4px">{{ t('review.pv.video') }}</div>
        <m-table size="small" :data="vRows" :columns="[{title:t('review.pv.field'),key:'k',width:160},{title:t('review.pv.value'),key:'v',ellipsis:{tooltip:true}}]" max-height="260" />
        <div class="muted" style="margin:12px 0 4px">{{ t('review.pv.episodes', { n: pv.vs_dramas_video_episodes.length }) }}</div>
        <m-table size="small" :data="pv.vs_dramas_video_episodes" :columns="eCols" max-height="300" :scroll-x="1200" />
      </template>
      <n-empty v-else />
    </n-modal>
  </template>
</template>
<style scoped>
.script{white-space:pre-wrap;background:#0f0f0f;color:#eaeaea;padding:10px 12px;border-radius:6px;font-family:inherit;font-size:13px;line-height:1.7;max-height:320px;overflow:auto}
.shots{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:8px}
.shot{border:1px solid #eee;border-left:3px solid #FF2C48;border-radius:4px;padding:6px 8px;font-size:12px}
.views{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.v{text-align:center;font-size:11px;color:#666}
.v :deep(img){border-radius:4px;background:#f2f2f2}
.ph{width:92px;height:128px;background:#f2f2f2;display:flex;align-items:center;justify-content:center;color:#aaa;border-radius:4px}
.iss{border:1px dashed #ddd;padding:6px;border-radius:4px;margin-bottom:6px}
.issue{color:#b26a00;font-size:12px}
.banner{background:#FF2C48;color:#fff;font-weight:700;padding:10px 14px;border-radius:6px;font-size:15px}
.banner.ok{background:#18a058}
.sticky{position:sticky;top:12px}
.shots{grid-template-columns:repeat(auto-fill,minmax(240px,1fr))}
@media (max-width:767px){.views .v :deep(img),.ph{width:72px!important;height:100px!important}}
</style>
