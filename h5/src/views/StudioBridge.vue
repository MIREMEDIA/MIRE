<template>
  <section class="scr">
    <div class="body" style="padding:40px 24px;text-align:center">
      <p class="note">{{ $t('common.loading') }}</p>
    </div>
  </section>
</template>
<script setup lang="ts">
/**
 * FE-M3 Studio bridge: internal path so login ?redirect=/studio works with safeRedirect.
 * Logged-in: same-tab navigate to Studio (more reliable than window.open on mobile).
 * Guest: push #/login?redirect=/studio.
 */
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUser } from '../stores/user'
import { studioUrl } from '../api/games'

const user = useUser(); const router = useRouter()
onMounted(() => {
  if (!user.token) {
    router.replace({ path: '/login', query: { redirect: '/studio' } })
    return
  }
  // same-tab: avoids popup blockers; documented in fe_audit/m3h5/README.md
  location.assign(studioUrl())
})
</script>
