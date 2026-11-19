// Small paginated-list helper for B8 read views
import { ref } from 'vue'
import { api } from '../../api'
export function usePaged(r: string, init: Record<string, any> = {}, size = 20) {
  const f = ref<Record<string, any>>({ ...init, page: 1 })
  const d = ref<any>(null); const err = ref(''); const loading = ref(false)
  async function load() { err.value = ''; loading.value = true; try { d.value = await api(r, { ...f.value, size }) } catch (e: any) { err.value = e.message } finally { loading.value = false } }
  function search() { f.value.page = 1; load() }
  const pag = () => ({ page: f.value.page, pageSize: size, itemCount: d.value?.total || 0, onUpdatePage: (p: number) => { f.value.page = p; load() } })
  return { f, d, err, loading, load, search, pag }
}
